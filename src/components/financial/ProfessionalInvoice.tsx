"use client";

import React, { useRef } from "react";
import type { TripFinancial } from "@/types/financial";
import type { Currency } from "@/types/pricing";

interface ProfessionalInvoiceProps {
    fin: TripFinancial;
    fm: (amount: number | string, currency?: Currency) => string;
    cs: (currency?: Currency) => string;
    companyName: string;
    agentName: string;
    agentEmail: string;
}

export const ProfessionalInvoice = React.forwardRef<HTMLDivElement, ProfessionalInvoiceProps>(
    function ProfessionalInvoice({ fin, fm, cs, companyName, agentName, agentEmail }, ref) {
        const totalPaid = fin.payments.reduce((s, p) => s + p.amount, 0);
        const taxRate = fin.taxPercentage ?? 0;
        const subtotal = fin.clientPrice;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;
        const balance = Math.max(0, total - totalPaid);
        const isFullyPaid = balance <= 0 && fin.clientPrice > 0;
        const currSymbol = cs(fin.currency);

        const invoiceNum = `INV-${(fin.tripId || fin.itineraryId.slice(0, 8)).toUpperCase()}`;
        const issuedDate = new Date().toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });
        const dueDate = new Date(Date.now() + 15 * 86_400_000).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" });

        return (
            <div
                ref={ref}
                id="printable-invoice"
                style={{
                    fontFamily: "'Inter', 'Segoe UI', -apple-system, sans-serif",
                    background: "#ffffff",
                    color: "#1a1a2e",
                    width: "100%",
                    maxWidth: "794px",
                    margin: "0 auto",
                    padding: "0",
                    boxSizing: "border-box",
                }}
            >
                {/* Header Band */}
                <div style={{
                    background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 60%, #0f3460 100%)",
                    padding: "40px 48px 32px",
                    position: "relative",
                    overflow: "hidden",
                }}>
                    <div style={{ position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
                    <div style={{ position: "absolute", bottom: "-40px", right: "80px", width: "120px", height: "120px", borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", position: "relative" }}>
                        <div>
                            <div style={{ fontSize: "26px", fontWeight: "800", color: "#ffffff", letterSpacing: "-0.5px", marginBottom: "4px" }}>
                                {companyName}
                            </div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.55)", fontWeight: "500" }}>{agentName}</div>
                            <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginTop: "2px" }}>{agentEmail}</div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "34px", fontWeight: "900", color: "#ffffff", letterSpacing: "-1px", lineHeight: "1" }}>INVOICE</div>
                            <div style={{
                                marginTop: "8px", display: "inline-block",
                                background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)",
                                borderRadius: "6px", padding: "4px 12px",
                                fontSize: "13px", fontWeight: "700", color: "rgba(255,255,255,0.9)",
                                letterSpacing: "0.5px", fontFamily: "monospace",
                            }}>
                                {invoiceNum}
                            </div>
                            {isFullyPaid && (
                                <div style={{
                                    marginTop: "8px", display: "block",
                                    background: "rgba(34,197,94,0.25)", border: "1px solid rgba(34,197,94,0.4)",
                                    borderRadius: "6px", padding: "3px 12px",
                                    fontSize: "11px", fontWeight: "700", color: "#86efac",
                                    textAlign: "center", letterSpacing: "1px", textTransform: "uppercase",
                                }}>
                                    ✓ PAID IN FULL
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Meta Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", padding: "16px 48px", gap: "24px" }}>
                    {[
                        { label: "ISSUE DATE", value: issuedDate },
                        { label: "DUE DATE", value: dueDate },
                        { label: "REFERENCE", value: fin.tripId || fin.itineraryId.slice(0, 8).toUpperCase() },
                    ].map(({ label, value }) => (
                        <div key={label}>
                            <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "3px" }}>{label}</div>
                            <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b" }}>{value}</div>
                        </div>
                    ))}
                </div>

                {/* Bill To / Trip Info */}
                <div style={{ display: "flex", gap: "0", padding: "32px 48px 24px" }}>
                    <div style={{ flex: 1, paddingRight: "32px", borderRight: "1px solid #e2e8f0" }}>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>BILL TO</div>
                        <div style={{ fontSize: "18px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>{fin.clientName}</div>
                        {fin.clientEmail && <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "2px" }}>{fin.clientEmail}</div>}
                        {fin.adultPax > 0 && (
                            <div style={{ marginTop: "8px", fontSize: "12px", color: "#64748b" }}>
                                {fin.adultPax} Adult{fin.adultPax > 1 ? "s" : ""}
                                {fin.childPax > 0 && ` · ${fin.childPax} Child${fin.childPax > 1 ? "ren" : ""}`}
                                {fin.infantPax > 0 && ` · ${fin.infantPax} Infant${fin.infantPax > 1 ? "s" : ""}`}
                            </div>
                        )}
                    </div>

                    <div style={{ flex: 1, paddingLeft: "32px" }}>
                        <div style={{ fontSize: "9px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>TRIP DETAILS</div>
                        <div style={{ fontSize: "15px", fontWeight: "700", color: "#1a1a2e", marginBottom: "4px" }}>{fin.tripTitle}</div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>{fin.destination}</div>
                        {fin.startDate && (
                            <div style={{ marginTop: "6px", fontSize: "12px", color: "#64748b" }}>
                                {new Date(fin.startDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                {fin.endDate && ` – ${new Date(fin.endDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
                            </div>
                        )}
                        <div style={{
                            marginTop: "8px", display: "inline-block",
                            background: fin.status === "booked" || fin.status === "confirmed" ? "rgba(34,197,94,0.08)" : "rgba(99,102,241,0.08)",
                            border: fin.status === "booked" || fin.status === "confirmed" ? "1px solid rgba(34,197,94,0.25)" : "1px solid rgba(99,102,241,0.25)",
                            borderRadius: "5px", padding: "2px 10px",
                            fontSize: "10px", fontWeight: "700",
                            color: fin.status === "booked" || fin.status === "confirmed" ? "#16a34a" : "#6366f1",
                            textTransform: "uppercase", letterSpacing: "0.5px",
                        }}>
                            {fin.status}
                        </div>
                    </div>
                </div>

                {/* Line Items Table */}
                <div style={{ padding: "0 48px 24px" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                        <thead>
                            <tr style={{ background: "#1a1a2e" }}>
                                <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: "1px", textTransform: "uppercase", width: "60%" }}>Description</th>
                                <th style={{ padding: "12px 16px", textAlign: "center", fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: "1px", textTransform: "uppercase", width: "20%" }}>Pax</th>
                                <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "10px", fontWeight: "700", color: "rgba(255,255,255,0.7)", letterSpacing: "1px", textTransform: "uppercase", width: "20%" }}>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ background: "#ffffff", borderBottom: "1px solid #f1f5f9" }}>
                                <td style={{ padding: "16px 16px 12px", verticalAlign: "top" }}>
                                    <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b", marginBottom: "3px" }}>Complete Travel Package</div>
                                    <div style={{ fontSize: "12px", color: "#64748b" }}>{fin.tripTitle} · {fin.destination}</div>
                                </td>
                                <td style={{ padding: "16px 16px 12px", textAlign: "center", verticalAlign: "top" }}>
                                    <div style={{ fontSize: "13px", color: "#475569" }}>
                                        {fin.adultPax > 0 ? `${fin.adultPax}A${fin.childPax > 0 ? ` + ${fin.childPax}C` : ""}` : "—"}
                                    </div>
                                </td>
                                <td style={{ padding: "16px 16px 12px", textAlign: "right", verticalAlign: "top" }}>
                                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>{fm(subtotal, fin.currency)}</div>
                                </td>
                            </tr>

                            {fin.milestones?.length > 0 && (
                                <tr style={{ background: "#fafbff", borderBottom: "1px solid #f1f5f9" }}>
                                    <td colSpan={3} style={{ padding: "10px 16px" }}>
                                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "6px" }}>Payment Schedule</div>
                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {fin.milestones.map((m, i) => (
                                                <div key={i} style={{ background: "#f0f4ff", border: "1px solid #c7d7fd", borderRadius: "5px", padding: "4px 10px", fontSize: "11px", color: "#3730a3", fontWeight: "600" }}>
                                                    {m.label}: {m.percentage}% ({fm(Math.round(fin.clientPrice * m.percentage / 100), fin.currency)})
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Totals Section */}
                    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
                        <div style={{ width: "280px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Subtotal</span>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{fm(subtotal, fin.currency)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
                                <span style={{ fontSize: "13px", color: "#64748b" }}>Tax / GST ({taxRate}%)</span>
                                <span style={{ fontSize: "13px", fontWeight: "600", color: "#334155" }}>{fm(taxAmount, fin.currency)}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "#1a1a2e", borderTop: "2px solid #1a1a2e" }}>
                                <span style={{ fontSize: "14px", fontWeight: "700", color: "rgba(255,255,255,0.85)" }}>Total</span>
                                <span style={{ fontSize: "16px", fontWeight: "800", color: "#ffffff" }}>{fm(total, fin.currency)}</span>
                            </div>
                            {totalPaid > 0 && (
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 16px", background: "#f0fdf4", borderTop: "1px solid #bbf7d0" }}>
                                    <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: "600" }}>Payments Received</span>
                                    <span style={{ fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>−{fm(totalPaid, fin.currency)}</span>
                                </div>
                            )}
                            <div style={{
                                display: "flex", justifyContent: "space-between",
                                padding: "12px 16px",
                                background: isFullyPaid ? "#f0fdf4" : "#fff7ed",
                                borderTop: isFullyPaid ? "1px solid #bbf7d0" : "1px solid #fed7aa",
                            }}>
                                <span style={{ fontSize: "14px", fontWeight: "700", color: isFullyPaid ? "#16a34a" : "#c2410c" }}>
                                    {isFullyPaid ? "✓ Balance Due" : "Balance Due"}
                                </span>
                                <span style={{ fontSize: "16px", fontWeight: "800", color: isFullyPaid ? "#16a34a" : "#c2410c" }}>
                                    {fm(balance, fin.currency)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Payments Received Table */}
                {fin.payments.length > 0 && (
                    <div style={{ padding: "0 48px 28px" }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "10px" }}>PAYMENT HISTORY</div>
                        <table style={{ width: "100%", borderCollapse: "collapse" }}>
                            <thead>
                                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                                    {["Date", "Type", "Method", "Reference", "Amount"].map((h, i) => (
                                        <th key={h} style={{ padding: "8px 12px", textAlign: i === 4 ? "right" : "left", fontSize: "10px", fontWeight: "700", color: "#94a3b8", letterSpacing: "0.5px", textTransform: "uppercase" }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {fin.payments.map((p, i) => (
                                    <tr key={p.id} style={{ background: i % 2 === 0 ? "#ffffff" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
                                        <td style={{ padding: "8px 12px", fontSize: "12px", color: "#475569" }}>
                                            {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                        </td>
                                        <td style={{ padding: "8px 12px" }}>
                                            <span style={{ display: "inline-block", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: "4px", padding: "1px 8px", fontSize: "10px", fontWeight: "700", color: "#5b21b6", textTransform: "capitalize" }}>
                                                {p.type}
                                            </span>
                                        </td>
                                        <td style={{ padding: "8px 12px", fontSize: "12px", color: "#475569", textTransform: "capitalize" }}>{p.method.replace("_", " ")}</td>
                                        <td style={{ padding: "8px 12px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>{p.reference || "—"}</td>
                                        <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>+{fm(p.amount, fin.currency)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Divider */}
                <div style={{ margin: "0 48px", borderTop: "1px solid #e2e8f0" }} />

                {/* Footer */}
                <div style={{ padding: "24px 48px 32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "24px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "10px", fontWeight: "700", color: "#94a3b8", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>NOTES & TERMS</div>
                        <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.6", maxWidth: "360px" }}>
                            Thank you for choosing {companyName}. This is a computer-generated invoice and does not require a physical signature. Please retain this document for your records.
                        </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "9px", color: "#cbd5e1", letterSpacing: "1px", textTransform: "uppercase" }}>Generated by</div>
                        <div style={{ fontSize: "14px", fontWeight: "800", color: "#1a1a2e", letterSpacing: "-0.3px" }}>{companyName}</div>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>{agentEmail}</div>
                    </div>
                </div>

                {/* Bottom accent bar */}
                <div style={{ height: "6px", background: "linear-gradient(90deg, #1a1a2e 0%, #0f3460 50%, #533483 100%)" }} />
            </div>
        );
    }
);

ProfessionalInvoice.displayName = "ProfessionalInvoice";
