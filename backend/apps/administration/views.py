import time

from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated

from apps.authorization.permissions import IsActiveUser
from apps.companies.models import Company
from apps.warehouses.models import Warehouse
from utils.response_helper import ApiResponse
from config.logging_utils import get_logger, build_request_context

logger = get_logger(__name__)
User = get_user_model()


def _relative_time(value):
	if value is None:
		return "Reciente"

	delta = timezone.now() - value
	if delta.days > 0:
		return f"Hace {delta.days} días"

	hours = delta.seconds // 3600
	if hours > 0:
		return f"Hace {hours} horas"

	minutes = delta.seconds // 60
	if minutes > 0:
		return f"Hace {minutes} minutos"

	return "Hace unos segundos"


def _warehouse_location(warehouse):
	city = getattr(warehouse, "city", "") or ""
	state = getattr(warehouse, "state", "") or ""
	if city and state:
		return f"{city}, {state}"
	return city or state or "Ubicacion no disponible"


class DashboardSummaryView(APIView):
	permission_classes = [IsAuthenticated, IsActiveUser]

	def get(self, request):
		ctx = build_request_context(request)
		role = getattr(request.user, "role", None)
		start = time.perf_counter()

		logger.debug(
			"dashboard | action=get_summary | role={role} | request_id={request_id} | user_id={user_id}",
			role=role,
			**ctx,
		)

		if role == "admin":
			companies_qs = Company.objects.filter(active=True).order_by("-created_at")
			warehouses_qs = Warehouse.objects.filter(active=True).order_by("-created_at")
			users_qs = User.objects.filter(is_active=True).order_by("-created_at")

			stats = [
				{"id": 1, "label": "Companias", "value": companies_qs.count()},
				{"id": 2, "label": "Almacenes", "value": warehouses_qs.count()},
				{"id": 3, "label": "Usuarios", "value": users_qs.count()},
				{"id": 4, "label": "Rutas activas", "value": 0},
			]

			warehouses = [
				{
					"id": warehouse.id,
					"name": warehouse.name,
					"location": _warehouse_location(warehouse),
				}
				for warehouse in warehouses_qs[:8]
			]

			recent_activity = []
			for company in companies_qs[:3]:
				recent_activity.append(
					{
						"id": f"company-{company.id}",
						"action": "Compania creada",
						"description": f"Se registro {company.name}",
						"time": _relative_time(company.created_at),
						"type": "success",
						"user": company.name,
						"sort_key": company.created_at,
					}
				)

			for warehouse in warehouses_qs[:3]:
				recent_activity.append(
					{
						"id": f"warehouse-{warehouse.id}",
						"action": "Almacen creado",
						"description": f"Se agrego {warehouse.name}",
						"time": _relative_time(warehouse.created_at),
						"type": "info",
						"user": getattr(warehouse.company, "name", "Sistema"),
						"sort_key": warehouse.created_at,
					}
				)

			for user in users_qs[:3]:
				recent_activity.append(
					{
						"id": f"user-{user.id}",
						"action": "Usuario creado",
						"description": f"Se creo {user.name or user.email}",
						"time": _relative_time(user.created_at),
						"type": "warning" if user.role == "company" else "info",
						"user": user.name or user.email,
						"sort_key": user.created_at,
					}
				)

			recent_activity = sorted(
				recent_activity,
				key=lambda item: item["sort_key"],
				reverse=True,
			)[:5]
			for item in recent_activity:
				item.pop("sort_key", None)

			elapsed_ms = int((time.perf_counter() - start) * 1000)
			logger.info(
				"dashboard | action=get_summary | result=success | role=admin "
				"| companies={companies} | warehouses={warehouses_count} | users={users} "
				"| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
				"| status_code=200",
				companies=stats[0]["value"],
				warehouses_count=stats[1]["value"],
				users=stats[2]["value"],
				elapsed_ms=elapsed_ms,
				**ctx,
			)

			return ApiResponse.success(
				message="Dashboard summary retrieved.",
				data={
					"stats": stats,
					"warehouses": warehouses,
					"recentActivity": recent_activity,
				},
			)

		if role == "company":
			company = getattr(request.user, "company", None)
			warehouses_qs = Warehouse.objects.filter(active=True, company=company).order_by("-created_at")

			stats = [
				{"id": 1, "label": "Almacenes", "value": warehouses_qs.count()},
				{"id": 2, "label": "Rutas activas", "value": 0},
				{"id": 3, "label": "Usuarios", "value": User.objects.filter(is_active=True, company=company).count()},
				{"id": 4, "label": "Compania", "value": 1 if company else 0},
			]

			warehouses = [
				{
					"id": warehouse.id,
					"name": warehouse.name,
					"location": _warehouse_location(warehouse),
				}
				for warehouse in warehouses_qs[:8]
			]

			recent_activity = [
				{
					"id": f"warehouse-{warehouse.id}",
					"action": "Almacen actualizado",
					"description": f"{warehouse.name} permanece activo",
					"time": _relative_time(warehouse.updated_at),
					"type": "success",
					"user": company.name if company else "Sistema",
					"sort_key": warehouse.updated_at,
				}
				for warehouse in warehouses_qs[:5]
			]

			for item in recent_activity:
				item.pop("sort_key", None)

			elapsed_ms = int((time.perf_counter() - start) * 1000)
			logger.info(
				"dashboard | action=get_summary | result=success | role=company "
				"| company_id={company_id} | warehouses={warehouses_count} "
				"| execution_time_ms={elapsed_ms} | request_id={request_id} | user_id={user_id} "
				"| status_code=200",
				company_id=getattr(company, "id", None),
				warehouses_count=stats[0]["value"],
				elapsed_ms=elapsed_ms,
				**ctx,
			)

			return ApiResponse.success(
				message="Dashboard summary retrieved.",
				data={
					"stats": stats,
					"warehouses": warehouses,
					"recentActivity": recent_activity,
				},
			)

		logger.warning(
			"dashboard | action=get_summary | result=unsupported_role | role={role} "
			"| request_id={request_id} | user_id={user_id}",
			role=role,
			**ctx,
		)
		return ApiResponse.error(
			message="Unsupported role.",
			errors={"detail": "User role not supported for dashboard summary."},
			status=403,
		)
