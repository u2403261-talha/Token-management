import React from "react";

export function StatCardSkeleton() {
  return (
    <div className="stat-card">
      <div className="stat-info" style={{ width: "60%" }}>
        <div className="skeleton skeleton-text" style={{ width: "40%" }}></div>
        <div className="skeleton skeleton-title" style={{ width: "80%", height: "28px", margin: "8px 0 0" }}></div>
      </div>
      <div className="skeleton" style={{ width: "44px", height: "44px", borderRadius: "12px" }}></div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}>
          <div className="skeleton skeleton-text" style={{ width: i === 0 ? "40px" : "80%", margin: 0 }}></div>
        </td>
      ))}
    </tr>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="event-card">
      <div style={{ flex: 1 }}>
        <div className="skeleton skeleton-title" style={{ width: "50%", margin: 0 }}></div>
      </div>
      <div className="button-group">
        <div className="skeleton" style={{ width: "70px", height: "32px", borderRadius: "8px" }}></div>
        <div className="skeleton" style={{ width: "60px", height: "32px", borderRadius: "8px" }}></div>
      </div>
    </div>
  );
}
