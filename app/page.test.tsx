import { render, screen } from "@testing-library/react";
import { SessionProvider } from "next-auth/react";
import LandingPage from "./page";

function renderLandingPage() {
  render(
    <SessionProvider session={null}>
      <LandingPage />
    </SessionProvider>,
  );
}

describe("homepage landing page", () => {
  it("renders the new editorial hero and premium navigation", () => {
    renderLandingPage();

    expect(
      screen.getByRole("heading", {
        name: /speak english with confidence every day/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^home$/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^features$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /^how it works$/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/built for learners focused on/i),
    ).toBeInTheDocument();
  });

  it("renders capabilities, social proof, and the closing cta", () => {
    renderLandingPage();

    expect(
      screen.getByRole("heading", {
        name: /serious progress\. zero guesswork\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /everything is built for speaking outcomes\./i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("18k+")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /learners feel the difference in weeks\./i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: /start your first confident english conversation today\./i,
      }),
    ).toBeInTheDocument();
  });
});
