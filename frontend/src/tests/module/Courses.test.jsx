// import { describe, test, vi, beforeEach } from "vitest";
// import { render, screen, waitFor, fireEvent} from "@testing-library/react";
// import "@testing-library/jest-dom";
// import Courses from "../../pages/Courses"; // adjust path as needed
// import { AuthContext } from "../../services/AuthContext";
// import { GetModule, GetUserModuleInteract, tagApi, SaveUserModuleInteract } from "../../services/api";
// import { MemoryRouter } from "react-router-dom";
// import CourseItem from "../../components/CourseItem";
// import { act } from "react";


// vi.mock("../../services/api", () => ({
//   GetModule: vi.fn(),
//   GetUserModuleInteract: vi.fn(),
//   SaveUserModuleInteract: vi.fn(),
//   tagApi: {
//     getAll: vi.fn()
//   }
// }));

// vi.mock("../../services/EnrollmentContext", () => ({
//   useEnrollment: () => ({
//     isEnrolled: vi.fn(() => false),
//     enrollInModule: vi.fn()
//   })
// }));


// const mockUser = {
//   user_type: "admin",
//   tags: [{ tag: "depression" }, { tag: "big sad" }]
// };

// const mockToken = "fake-token";

// const safeRenderWithContext = async (ui) => {
//   await act(async () => {
//     renderWithContext(ui);
//   });
// };

// const renderWithContext = (ui) =>
//   act(() =>
//     render(
//       <AuthContext.Provider value={{ user: mockUser, token: mockToken }}>
//         <MemoryRouter>
//           {ui}
//         </MemoryRouter>
//       </AuthContext.Provider>
//     )
//   );

// beforeEach(() => {
//   vi.restoreAllMocks();
// });

// describe("Courses Component", () => {
//   test("renders tag section when user is admin", async () => {
//     GetModule.mockResolvedValue([]);
//     GetUserModuleInteract.mockResolvedValue([]);
//     tagApi.getAll.mockResolvedValue({ data: mockUser.tags });

//     await safeRenderWithContext(<Courses role="admin" />);

//     await waitFor(() => {
//       expect(screen.getByText("Tags")).toBeInTheDocument();
//       expect(screen.getByText("depression")).toBeInTheDocument();
//       expect(screen.getByText("big sad")).toBeInTheDocument();
//     });
//   });

  // test("shows create module button for admin", async () => {
  //   GetModule.mockResolvedValue([]);
  //   GetUserModuleInteract.mockResolvedValue([]);
  //   tagApi.getAll.mockResolvedValue({ data: mockUser.tags });

  //   await safeRenderWithContext(<Courses role="admin" />);

  //   await waitFor(() => {
  //     expect(screen.getByText("Create Module")).toBeInTheDocument();
  //   });
  // });

//   test("renders course list title", async () => {
//     GetModule.mockResolvedValue([]);
//     GetUserModuleInteract.mockResolvedValue([]);
//     tagApi.getAll.mockResolvedValue({ data: mockUser.tags });

//     await safeRenderWithContext(<Courses role="admin" />);

//     await waitFor(() => {
//       expect(screen.getByText("Courses")).toBeInTheDocument();
//     });
//   });


//   test("renders authorization error if user is not logged in", async () => {
//     render(
//       <AuthContext.Provider value={{ user: null, token: "fake-token" }}>
//         <MemoryRouter>
//           <Courses role="admin" />
//         </MemoryRouter>
//       </AuthContext.Provider>
//     );
  
//     expect(
//       screen.getByText(/Authorization Failed mate. Please log in/i)
//     ).toBeInTheDocument();
//   });

//   test("renders user tags when user is not admin", async () => {
//     const mockUser = {
//       user_type: "service_user",
//       tags: [{ tag: "anxiety" }]
//     };
  
//     render(
//       <AuthContext.Provider value={{ user: mockUser, token: "token" }}>
//         <MemoryRouter>
//           <Courses />
//         </MemoryRouter>
//       </AuthContext.Provider>
//     );
  
//     await waitFor(() => {
//       expect(screen.getByText("anxiety")).toBeInTheDocument();
//     });
//   });

//   test("logs error if tag API fails for admin", async () => {
//     const mockUser = {
//       user_type: "admin",
//       tags: []
//     };
  
//     vi.spyOn(console, "error").mockImplementation(() => {}); // silence expected error
  
//     tagApi.getAll.mockRejectedValue(new Error("API failure"));
  
//     render(
//       <AuthContext.Provider value={{ user: mockUser, token: "token" }}>
//         <MemoryRouter>
//           <Courses />
//         </MemoryRouter>
//       </AuthContext.Provider>
//     );
  
//     await waitFor(() => {
//       expect(console.error).toHaveBeenCalledWith(
//         "Error fetching tags: ",
//         expect.any(Error)
//       );
//     });
//   });

//   test("renders CourseItem with module and interaction", async () => {
//     const mockUser = {
//       user_type: "admin",
//       tags: []
//     };
  
//     GetModule.mockResolvedValue([{ id: 1, title: "Dealing with Anxiety in the workplace", upvotes: 10 }]);
//     GetUserModuleInteract.mockResolvedValue([{ module: 1, hasPinned: true }]);
//     tagApi.getAll.mockResolvedValue({ data: [] });
  
//     render(
//       <AuthContext.Provider value={{ user: mockUser, token: "token" }}>
//         <MemoryRouter>
//           <Courses />
//         </MemoryRouter>
//       </AuthContext.Provider>
//     );
  
//     await waitFor(() => {
//       expect(screen.getByText((content) =>
//         content.includes("Dealing with Anxiety in the workplace")
//     )).toBeInTheDocument();
//     });
//   });

//   test("triggers edit button click handler", async () => {
//     const mockUser = {
//       user_type: "admin", // not a service user
//       tags: [{ id: 1, tag: "anxiety" }],
//     };
  
//     tagApi.getAll.mockResolvedValue({ data: mockUser.tags });
//     GetModule.mockResolvedValue([]);
//     GetUserModuleInteract.mockResolvedValue([]);
  
//     await act(async () =>
//       render(
//         <AuthContext.Provider value={{ user: mockUser, token: "token" }}>
//           <MemoryRouter>
//             <Courses />
//           </MemoryRouter>
//         </AuthContext.Provider>
//       )
//     );
  
//     const editButton = await screen.findByTestId("edit-button");
  
//     await act(async () => {
//       fireEvent.click(editButton);
//     });
  
//     expect(editButton).toBeInTheDocument();
//   });

//   test("does not show create module button for non-admin", async () => {
//     const mockUser = {
//       user_type: "standard",
//       tags: []
//     };
  
//     render(
//       <AuthContext.Provider value={{ user: mockUser, token: "token" }}>
//         <MemoryRouter>
//           <Courses />
//         </MemoryRouter>
//       </AuthContext.Provider>
//     );
  
//     expect(screen.queryByText("Create Module")).not.toBeInTheDocument();
//   });


  // test("calls update_interact_module on interaction", async () => {
  //   const mockModule = { id: 1, title: "Module Test", upvotes: 3 };
  //   const mockInteraction = {
  //     hasLiked: true,
  //     hasPinned: true,
  //   };
    
  //   const update_interact_module = vi.fn((modId, obj) => {
  //     SaveUserModuleInteract(modId, obj, "token");
  //   });

  //   render(
  //     <AuthContext.Provider value={{ user: { user_type: "admin" }, token: "token" }}>
  //       <MemoryRouter>
  //         <CourseItem
  //           module={mockModule}
  //           role="admin"
  //           userInteractTarget={mockInteraction}
  //           update_interact_module={(modId, interact) =>
  //             update_interact_module(modId, interact)
  //           }
  //         />
  //       </MemoryRouter>
  //     </AuthContext.Provider>
  //   );
  
  //   const pinButton = await screen.getByTestId("pin-btn");
    
  //   await act(async () => {
  //     fireEvent.click(screen.getByTestId("pin-btn"));
  //   });
  
  //   await waitFor(() => {
  //     expect(SaveUserModuleInteract).toHaveBeenCalledWith(
  //       1,
  //       { hasLiked: true, hasPinned: false },
  //       "token"
  //     );
  //   });
  // });
});