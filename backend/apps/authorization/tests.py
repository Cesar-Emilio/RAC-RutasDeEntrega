import base64
import json

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.users.models import User


class LoginSecurityTests(APITestCase):
	def setUp(self):
		self.url = reverse("auth-login")
		self.password = "SecurePass123!"
		self.user = User.objects.create_user(
			email="security@example.com",
			password=self.password,
			name="Security User",
			role="admin",
			is_active=True,
		)

	def test_login_rejects_get_method(self):
		response = self.client.get(self.url)
		self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)

	def test_login_accepts_encrypted_payload_with_post(self):
		raw_payload = json.dumps(
			{
				"email": self.user.email,
				"password": self.password,
			}
		).encode("utf-8")
		encoded_payload = base64.b64encode(raw_payload).decode("utf-8")

		response = self.client.post(
			self.url,
			data={"payload": encoded_payload},
			format="json",
			HTTP_X_PAYLOAD_ENCRYPTED="true",
		)

		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertTrue(response.data.get("success"))
		data = response.data.get("data", {})
		self.assertIn("access", data)
		self.assertIn("refresh", data)
		self.assertEqual(data.get("user", {}).get("email"), self.user.email)
