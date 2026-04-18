"use client";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

const templateData = [
  {
    address: "Av Reforma 123, Ciudad de México",
    latitude: 19.432608,
    longitude: -99.133209,
    receiver_name: "Juan Pérez",
    package_quantity: 3,
  },
];

export async function downloadExcelTemplate() {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = "rac-rutas-de-entrega";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Entregas");
  sheet.views = [
    {
      state: "frozen",
      ySplit: 1,
    },
  ];

  sheet.columns = [
    { header: "address", key: "address", width: 45 },
    { header: "latitude", key: "latitude", width: 18 },
    { header: "longitude", key: "longitude", width: 18 },
    { header: "receiver_name", key: "receiver_name", width: 28 },
    { header: "package_quantity", key: "package_quantity", width: 20 },
  ];

  sheet.getRow(1).height = 22;

  sheet.getRow(1).eachCell((cell) => {
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
    };

    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "2563EB" },
    };

    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
    };

    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });

  sheet.addRow(templateData[0]);

  for (let i = 3; i <= 52; i++) {
    // Latitud
    sheet.getCell(`B${i}`).dataValidation = {
      type: "decimal",
      operator: "between",
      allowBlank: true,
      formulae: [-90, 90],
      showErrorMessage: true,
      errorTitle: "Latitud inválida",
      error: "Debe estar entre -90 y 90",
    };

    //Longitud
    sheet.getCell(`C${i}`).dataValidation = {
      type: "decimal",
      operator: "between",
      allowBlank: true,
      formulae: [-180, 180],
      showErrorMessage: true,
      errorTitle: "Longitud inválida",
      error: "Debe estar entre -180 y 180",
    };

    // Cantidad de paquetes
    sheet.getCell(`E${i}`).dataValidation = {
      type: "whole",
      operator: "greaterThanOrEqual",
      allowBlank: true,
      formulae: [1],
      showErrorMessage: true,
      errorTitle: "Cantidad inválida",
      error: "Debe ser un número entero mayor o igual a 1",
    };
  }

  const help = workbook.addWorksheet("Instrucciones");

  help.columns = [{ width: 80 }];

  help.getCell("A1").value = "Instrucciones para cargar rutas";
  help.getCell("A1").font = { bold: true, size: 16 };

  help.getCell("A3").value =
    "1. No modifiques los nombres de columnas.";
  help.getCell("A4").value =
    "2. Una fila representa una entrega.";
  help.getCell("A5").value =
    "3. Latitude debe estar entre -90 y 90.";
  help.getCell("A6").value =
    "4. Longitude debe estar entre -180 y 180.";
  help.getCell("A7").value =
    "5. receiver_name es el nombre de quien recibe.";
  help.getCell("A8").value =
    "6. package_quantity debe ser entero mayor o igual a 1.";

  const buffer = await workbook.xlsx.writeBuffer();

  saveAs(
    new Blob([buffer]),
    "plantilla_rutas.xlsx"
  );
}

export function downloadJsonTemplate() {
  const json = JSON.stringify(templateData, null, 2);

  const blob = new Blob([json], {
    type: "application/json;charset=utf-8",
  });

  saveAs(blob, "plantilla_rutas.json");
}

export function downloadCsvTemplate() {
  const headers = ["address", "latitude", "longitude"];

  const rows = templateData.map((item) => [
    escapeCsv(item.address),
    item.latitude,
    item.longitude,
    escapeCsv(item.receiver_name),
    item.package_quantity,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  saveAs(blob, "plantilla_rutas.csv");
}

function escapeCsv(value: string) {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}