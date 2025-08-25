"use client";

import React, { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Image from "next/image";

type Item = {
  id: string;
  description: string;
  price: number;
  qty: number;
};

const currency = "৳";

export default function Page() {
  // Left-side form state
  const [date, setDate] = useState<string>(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [invoiceNo, setInvoiceNo] = useState("004");
  const [billToName, setBillToName] = useState("Ruhit");
  const [billToMobile, setBillToMobile] = useState("01713-197857");
  const [courier, setCourier] = useState<number>(200);
  const [advance, setAdvance] = useState<number>(0);
  const [vatPct, setVatPct] = useState<number>(0);
  const [items, setItems] = useState<Item[]>([
    {
      id: crypto.randomUUID(),
      description: "Half sleeve Polo",
      price: 480,
      qty: 1,
    },
  ]);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (s, it) => s + (Number(it.price) || 0) * (Number(it.qty) || 0),
        0
      ),
    [items]
  );
  const vatAmount = useMemo(
    () => (subtotal * (Number(vatPct) || 0)) / 100,
    [subtotal, vatPct]
  );
  const total = useMemo(
    () => subtotal + vatAmount + (Number(courier) || 0),
    [subtotal, vatAmount, courier]
  );
  const due = useMemo(
    () => Math.max(total - (Number(advance) || 0), 0),
    [total, advance]
  );

  const invoiceRef = useRef<HTMLDivElement>(null);

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), description: "", price: 0, qty: 1 },
    ]);
  };
  const updateItem = (id: string, patch: Partial<Item>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  };
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const onSignatureSelect: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSignatureDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  async function downloadPdf() {
    const el = invoiceRef.current;
    if (!el) return;

    // Create a temporary style element to override any lab() colors and optimize for PDF
    const tempStyle = document.createElement("style");
    tempStyle.textContent = `
      * {
        color: rgb(0, 0, 0) !important;
        background-color: rgb(255, 255, 255) !important;
        border-color: rgb(229, 231, 235) !important;
      }
      .bg-blue-600 { background-color: rgb(37, 99, 235) !important; }
      .text-blue-700 { color: rgb(29, 78, 216) !important; }
      .text-blue-600 { color: rgb(37, 99, 235) !important; }
      .bg-gray-50 { background-color: rgb(249, 250, 251) !important; }
      .text-gray-600 { color: rgb(75, 85, 99) !important; }
      .text-gray-700 { color: rgb(55, 65, 81) !important; }
      .text-gray-500 { color: rgb(107, 114, 128) !important; }
      .text-gray-400 { color: rgb(156, 163, 175) !important; }
      .border { border-color: rgb(229, 231, 235) !important; }
      .border-t { border-top-color: rgb(229, 231, 235) !important; }
      
      /* Optimize for single page PDF - match the clean layout */
      .invoice-a4 {
        max-height: 297mm !important;
        overflow: hidden !important;
        padding: 20px !important;
        margin-top: 0 !important;
      }
      .invoice-a4 * {
        font-size: 13px !important;
        line-height: 1.6 !important;
      }
      .invoice-a4 h1 {
        font-size: 22px !important;
      }
      .invoice-a4 .text-2xl {
        font-size: 20px !important;
      }
      .invoice-a4 .text-sm {
        font-size: 11px !important;
      }
      .invoice-a4 .text-xs {
        font-size: 10px !important;
      }
      .invoice-a4 .p-6 {
        padding: 16px !important;
      }
      .invoice-a4 .p-4 {
        padding: 14px !important;
      }
      .invoice-a4 .py-3 {
        padding-top: 8px !important;
        padding-bottom: 8px !important;
      }
      .invoice-a4 .px-4 {
        padding-left: 10px !important;
        padding-right: 10px !important;
      }
      .invoice-a4 .mt-6 {
        margin-top: 16px !important;
      }
      .invoice-a4 .mt-12 {
        margin-top: 24px !important;
      }
      .invoice-a4 .mt-4 {
        margin-top: 14px !important;
      }
      .invoice-a4 .mt-5 {
        margin-top: 16px !important;
      }
      .invoice-a4 .mt-8 {
        margin-top: 20px !important;
      }
      .invoice-a4 .h-12 {
        height: 32px !important;
      }
      .invoice-a4 .w-12 {
        width: 32px !important;
      }
      .invoice-a4 .h-14 {
        height: 36px !important;
      }
      .invoice-a4 .w-14 {
        width: 36px !important;
      }
      .invoice-a4 .h-20 {
        height: 56px !important;
      }
      .invoice-a4 .w-56 {
        width: 140px !important;
      }
      .invoice-a4 table {
        border-spacing: 0 !important;
      }
      .invoice-a4 img {
        max-width: 100% !important;
        height: auto !important;
      }
      .invoice-a4 .flex.flex-col.gap-2 > div {
        margin-bottom: 8px !important;
      }
      .invoice-a4 .text-sm > div {
        margin-bottom: 6px !important;
      }
      .invoice-a4 .mb-1 {
        margin-bottom: 4px !important;
      }
      .invoice-a4 .mb-6 {
        margin-bottom: 16px !important;
      }
      .invoice-a4 .gap-4 {
        gap: 12px !important;
      }
      .invoice-a4 table th,
      .invoice-a4 table td {
        padding: 12px 10px !important;
      }
    `;
    document.head.appendChild(tempStyle);

    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      width: el.scrollWidth,
      height: el.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      allowTaint: true,
    });

    // Clean up temporary style
    document.head.removeChild(tempStyle);

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Calculate dimensions to fit on one page with proper margins
    const imgWidth = pageWidth - 15; // 7.5mm margin on each side
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // If height exceeds page, scale down proportionally
    const finalWidth =
      imgHeight > pageHeight - 15
        ? ((pageHeight - 15) * imgWidth) / imgHeight
        : imgWidth;
    const finalHeight =
      imgHeight > pageHeight - 15 ? pageHeight - 15 : imgHeight;

    // Center the image on the page
    const x = (pageWidth - finalWidth) / 2;
    const y = (pageHeight - finalHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, finalWidth, finalHeight);
    pdf.save(`invoice-${invoiceNo || "download"}.pdf`);
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Image src="/logo.webp" alt="logo" width={62} height={2} />
            <div className="text-sm text-gray-500"> PDF export</div>
          </div>
          <button
            onClick={downloadPdf}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow-soft hover:bg-blue-700"
          >
            Download PDF
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 md:grid-cols-2">
        {/* Left: Form */}
        <div className="rounded-2xl border bg-white p-4 sm:p-6">
          <h2 className="text-lg font-semibold">Fill Details</h2>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Invoice No</label>
              <input
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Bill To — Name</label>
              <input
                value={billToName}
                onChange={(e) => setBillToName(e.target.value)}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Bill To — Mobile</label>
              <input
                value={billToMobile}
                onChange={(e) => setBillToMobile(e.target.value)}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">Courier Charge</label>
              <input
                type="number"
                value={courier}
                onChange={(e) => setCourier(Number(e.target.value))}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">VAT (%)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={vatPct}
                onChange={(e) => setVatPct(Number(e.target.value))}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-600">
                Advance (optional)
              </label>
              <input
                type="number"
                value={advance}
                onChange={(e) => setAdvance(Number(e.target.value))}
                className="rounded-lg border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-medium">Items</h3>
                <button
                  onClick={addItem}
                  className="rounded-lg border px-3 py-1 text-sm hover:bg-gray-50"
                >
                  + Add item
                </button>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 w-28">Price</th>
                      <th className="px-3 py-2 w-20">Qty</th>
                      <th className="px-3 py-2 w-32">Total</th>
                      <th className="px-3 py-2 w-12"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => {
                      const rowTotal =
                        (Number(it.price) || 0) * (Number(it.qty) || 0);
                      return (
                        <tr key={it.id} className="border-t">
                          <td className="px-3 py-2">
                            <input
                              placeholder="Description"
                              value={it.description}
                              onChange={(e) =>
                                updateItem(it.id, {
                                  description: e.target.value,
                                })
                              }
                              className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={it.price}
                              onChange={(e) =>
                                updateItem(it.id, {
                                  price: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              value={it.qty}
                              onChange={(e) =>
                                updateItem(it.id, {
                                  qty: Number(e.target.value),
                                })
                              }
                              className="w-full rounded-md border px-2 py-1 outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            {currency} {rowTotal.toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => removeItem(it.id)}
                              className="rounded-md border px-2 py-1 text-xs hover:bg-gray-50"
                              aria-label="Remove"
                            >
                              ✕
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sm:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <h4 className="font-medium">Notes</h4>
                <ul className="mt-2 list-disc pl-5 text-sm text-gray-600">
                  <li>Prices are in BDT.</li>
                  <li>Payment within 7 days.</li>
                </ul>
                <div className="mt-4">
                  <label className="text-sm text-gray-600 block mb-1">
                    Authorized signature image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={onSignatureSelect}
                  />
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal</span>
                    <span>
                      {currency} {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>VAT ({(Number(vatPct) || 0).toFixed(2)}%)</span>
                    <span>
                      {currency} {vatAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Courier Charge</span>
                    <span>
                      {currency} {Number(courier || 0).toFixed(2)}
                    </span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between font-semibold py-1">
                    <span>Total</span>
                    <span>
                      {currency} {total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Advance</span>
                    <span>
                      {currency} {Number(advance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-semibold text-base py-1">
                    <span>Due</span>
                    <span>
                      {currency} {due.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Invoice preview (captured to PDF) */}
        <div className="rounded-2xl border bg-white p-2 sm:p-4">
          <div
            ref={invoiceRef}
            className="invoice-a4 mx-auto rounded-xl border bg-white p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div>
                  <div className="grid h-14 w-14 place-items-center rounded-xl text-white font-bold overflow-hidden">
                    <Image
                      src="/logo.jpeg"
                      alt="Logo"
                      width={48}
                      height={48}
                      className="object-contain"
                    />
                  </div>
                  <h1 className="text-xl font-bold leading-6">INVOICE</h1>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span className="font-medium">📅 Date:</span>
                  <span>{date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">🧾 No. Invoice:</span>
                  <span>{invoiceNo}</span>
                </div>
              </div>
            </div>

            {/* Top info row */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-sm font-semibold">Bill To</div>
                <div className="mt-2 text-sm">
                  <div className="flex items-center gap-2">
                    👤 <span>{billToName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    📞 <span>{billToMobile}</span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-700 md:text-right">
                <div className="flex items-center justify-start md:justify-end gap-2">
                  🌐 <span>www.modoutfit.com</span>
                </div>
                <div className="flex items-center justify-start md:justify-end gap-2">
                  ☎️ <span>01760-367816</span>
                </div>
                <div className="mt-1">
                  2B, Section - 2, Avenue - 1,
                  <br />
                  Block - C, House - 18, Mirpur,
                  <br />
                  Dhaka - 1216, Bangladesh
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="mt-6">
              <div className="rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-left text-gray-600">
                    <tr>
                      <th className="px-4 py-3">Item Description</th>
                      <th className="px-4 py-3 w-24">Price</th>
                      <th className="px-4 py-3 w-16">Qty</th>
                      <th className="px-4 py-3 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr key={it.id} className="border-t">
                        <td className="px-4 py-3">{it.description || "-"}</td>
                        <td className="px-4 py-3">
                          {currency} {Number(it.price || 0).toFixed(2)}
                        </td>
                        <td className="px-4 py-3">{it.qty}</td>
                        <td className="px-4 py-3 font-medium">
                          {currency}{" "}
                          {(
                            Number(it.price || 0) * Number(it.qty || 0)
                          ).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payment + Summary */}
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="font-semibold">Payment Method</div>
                <div className="mt-2 text-sm">
                  <div>Bank Transfer</div>
                  <div className="mt-2">
                    <span className="text-gray-600">Bank Name:</span> Shahjalal
                    Islami Bank PLC
                  </div>
                  <div>
                    <span className="text-gray-600">Account Name:</span>{" "}
                    MODOUTFIT LIMITED
                  </div>
                  <div>
                    <span className="text-gray-600">Account Number:</span>{" "}
                    402311100004287
                  </div>
                  <div>
                    <span className="text-gray-600">Branch:</span> Panthapath,
                    Dhaka
                  </div>
                </div>
              </div>
              <div className="rounded-xl border p-4">
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between py-1">
                    <span>Subtotal</span>
                    <span>
                      {currency} {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>VAT ({(Number(vatPct) || 0).toFixed(2)}%)</span>
                    <span>
                      {currency} {vatAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Courier Charge</span>
                    <span>
                      {currency} {Number(courier || 0).toFixed(2)}
                    </span>
                  </div>
                  <hr className="my-3" />
                  <div className="flex justify-between font-semibold py-1">
                    <span>TOTAL</span>
                    <span>
                      {currency} {total.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Advance</span>
                    <span>
                      {currency} {Number(advance || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-semibold text-base py-1">
                    <span>DUE</span>
                    <span>
                      {currency} {due.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Authorized Signature */}
            <div className="mt-10 grid grid-cols-2 items-end">
              <div className="">
                <div className="h-20 w-56 rounded-md border grid place-items-center overflow-hidden bg-gray-50">
                  {signatureDataUrl ? (
                    <img
                      src={signatureDataUrl}
                      alt="Authorized signature"
                      className="max-h-20 object-contain"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">
                      Signature will appear here
                    </span>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-700">
                  Authorized Signature <br />
                  Shahriar Islam Rohan (Managing Directore)
                </div>
              </div>
              <div className="text-right text-sm text-gray-500">
                Thank you for your business.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
