import { test, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAuth } from "@/hooks/use-auth";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockSignInAction = vi.fn();
const mockSignUpAction = vi.fn();
vi.mock("@/actions", () => ({
  signIn: mockSignInAction,
  signUp: mockSignUpAction,
}));

const mockGetAnonWorkData = vi.fn();
const mockClearAnonWork = vi.fn();
vi.mock("@/lib/anon-work-tracker", () => ({
  getAnonWorkData: mockGetAnonWorkData,
  clearAnonWork: mockClearAnonWork,
}));

const mockGetProjects = vi.fn();
vi.mock("@/actions/get-projects", () => ({
  getProjects: mockGetProjects,
}));

const mockCreateProject = vi.fn();
vi.mock("@/actions/create-project", () => ({
  createProject: mockCreateProject,
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockGetAnonWorkData.mockReturnValue(null);
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "new-project-id" });
});

test("returns signIn, signUp, and isLoading=false initially", () => {
const { result } = renderHook(() => useAuth());

  expect(result.current.isLoading).toBe(false);
  expect(typeof result.current.signIn).toBe("function");
  expect(typeof result.current.signUp).toBe("function");
});

test("signIn sets isLoading during call and resets after", async () => {
mockSignInAction.mockResolvedValue({ success: true });
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("test@example.com", "password123");
  });

  expect(result.current.isLoading).toBe(false);
});

test("signIn calls signInAction with email and password", async () => {
mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "mypassword");
  });

  expect(mockSignInAction).toHaveBeenCalledWith("user@example.com", "mypassword");
});

test("signIn returns the result from signInAction", async () => {
const expected = { success: false, error: "Invalid credentials" };
  mockSignInAction.mockResolvedValue(expected);
  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signIn("user@example.com", "wrongpass");
  });

  expect(returnValue).toEqual(expected);
});

test("signIn does not navigate when result is not successful", async () => {
mockSignInAction.mockResolvedValue({ success: false, error: "Invalid credentials" });
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "wrongpass");
  });

  expect(mockPush).not.toHaveBeenCalled();
});

test("signIn navigates to existing project when no anon work", async () => {
mockSignInAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([{ id: "existing-project" }]);
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(mockPush).toHaveBeenCalledWith("/existing-project");
});

test("signIn creates new project and navigates when no projects exist", async () => {
mockSignInAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([]);
  mockCreateProject.mockResolvedValue({ id: "brand-new-project" });
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: [], data: {} })
  );
  expect(mockPush).toHaveBeenCalledWith("/brand-new-project");
});

test("signIn migrates anon work into a new project and clears it", async () => {
const anonMessages = [{ role: "user", content: "hello" }];
  const anonFsData = { "/App.jsx": { content: "export default () => <div/>" } };
  mockSignInAction.mockResolvedValue({ success: true });
  mockGetAnonWorkData.mockReturnValue({ messages: anonMessages, fileSystemData: anonFsData });
  mockCreateProject.mockResolvedValue({ id: "migrated-project" });
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123");
  });

  expect(mockCreateProject).toHaveBeenCalledWith(
    expect.objectContaining({ messages: anonMessages, data: anonFsData })
  );
  expect(mockClearAnonWork).toHaveBeenCalled();
  expect(mockGetProjects).not.toHaveBeenCalled();
  expect(mockPush).toHaveBeenCalledWith("/migrated-project");
});

test("signUp calls signUpAction with email and password", async () => {
mockSignUpAction.mockResolvedValue({ success: false, error: "Email already registered" });
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "securepass");
  });

  expect(mockSignUpAction).toHaveBeenCalledWith("new@example.com", "securepass");
});

test("signUp returns the result from signUpAction", async () => {
const expected = { success: false, error: "Email already registered" };
  mockSignUpAction.mockResolvedValue(expected);
  const { result } = renderHook(() => useAuth());

  let returnValue: any;
  await act(async () => {
    returnValue = await result.current.signUp("existing@example.com", "pass1234");
  });

  expect(returnValue).toEqual(expected);
});

test("signUp navigates on success following same post-sign-in logic", async () => {
mockSignUpAction.mockResolvedValue({ success: true });
  mockGetProjects.mockResolvedValue([{ id: "first-project" }]);
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("new@example.com", "securepass");
  });

  expect(mockPush).toHaveBeenCalledWith("/first-project");
});

test("isLoading resets to false even when signIn throws", async () => {
mockSignInAction.mockRejectedValue(new Error("network error"));
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signIn("user@example.com", "password123").catch(() => {});
  });

  expect(result.current.isLoading).toBe(false);
});

test("isLoading resets to false even when signUp throws", async () => {
mockSignUpAction.mockRejectedValue(new Error("network error"));
  const { result } = renderHook(() => useAuth());

  await act(async () => {
    await result.current.signUp("user@example.com", "password123").catch(() => {});
  });

  expect(result.current.isLoading).toBe(false);
});
