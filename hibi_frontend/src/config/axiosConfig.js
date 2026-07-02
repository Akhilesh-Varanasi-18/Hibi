// "use client"
import axios from "axios";
import { showToast } from "@/lib/ToastService";
import { Button } from "@/components/ui/button";
import { CircleAlert } from "lucide-react";

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_BACKEND_BASE_URI,
  withCredentials: true,
});

// ✅ Success & Error Interceptors
// axiosInstance.interceptors.response.use(
//   (response) => {
//     // Optional: Only show toast for certain status codes
//     if (response.status >= 200 && response.status < 300) {
//       // Uncomment if you want global success toast
//       console.log("Response:", response);
//       // showToast("Logged In Successfully","success");
//     }
//     return response;
//   },
//   (error) => {
//     showToast((
//       <div className="flex grow gap-3">
//         <CircleAlert
//           className="mt-0.5 shrink-0 text-red-500"
//           size={16}
//           aria-hidden="true"
//         />
//         <div className="flex grow flex-col gap-3">
//           <div className="space-y">
//             <p className="text-sm">
//               {error.response?.data?.message ||
//                 error.message ||
//                 'An unexpected error occurred'}
//             </p>
//           </div>
//         </div>
//       </div>
//     ), "error");
//     return Promise.reject(error);
//   }
// );

export default axiosInstance;
