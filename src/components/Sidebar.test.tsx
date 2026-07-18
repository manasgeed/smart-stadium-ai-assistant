import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Home, Settings } from "lucide-react";
import { Sidebar } from "./Sidebar";

describe("Sidebar", () => {
  it("renders navigation items", () => {
    const items = [
      { id: "home", label: "Home", icon: Home },
      { id: "settings", label: "Settings", icon: Settings },
    ];

    render(
      <Sidebar
        items={items}
        active="home"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("Home")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  it("calls onSelect when a button is clicked", () => {
    const onSelect = vi.fn();

    const items = [
      { id: "home", label: "Home", icon: Home },
      { id: "settings", label: "Settings", icon: Settings },
    ];

    render(
      <Sidebar
        items={items}
        active="home"
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText("Settings"));

    expect(onSelect).toHaveBeenCalledWith("settings");
  });

  it("shows badge when provided", () => {
    const items = [
      {
        id: "alerts",
        label: "Alerts",
        icon: Home,
        badge: 5,
      },
    ];

    render(
      <Sidebar
        items={items}
        active="alerts"
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText("5")).toBeInTheDocument();
  });
});