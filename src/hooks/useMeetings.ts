import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
} from "@tanstack/react-query";
import {
  getActiveMeetings,
  createMeeting,
  joinMeeting,
  // getMeetingById,
} from "@/api/meetings";
import { VideoRoom, CreateRoomFormData, IRoom } from "@/types";

// Query keys
export const meetingKeys = {
  all: ["meetings"] as const,
  active: () => [...meetingKeys.all, "active"] as const,
  detail: (id: string) => [...meetingKeys.all, "detail", id] as const,
};

// Get active meetings
export const useActiveMeetings = () => {
  return useQuery({
    queryKey: meetingKeys.active(),
    queryFn: getActiveMeetings,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
};

// Get meeting by ID
// export const useMeeting = (meetingId: string) => {
//   return useQuery({
//     queryKey: meetingKeys.detail(meetingId),
//     queryFn: () => getMeetingById(meetingId),
//     enabled: !!meetingId,
//   });
// };

// Create meeting mutation
export const useCreateMeetingMutation = (
  options?: UseMutationOptions<
    { success: boolean; room: IRoom },
    Error,
    CreateRoomFormData
  >
) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; room: IRoom },
    Error,
    CreateRoomFormData
  >({
    mutationFn: createMeeting,
    onSuccess: (data) => {
      // Invalidate and refetch active meetings
      queryClient.invalidateQueries({ queryKey: meetingKeys.active() });
    },
    ...options,
  });
};

// Join meeting mutation
export const useJoinMeetingMutation = (
  options?: UseMutationOptions<{ roomUrl: string }, Error, string>
) => {
  return useMutation<{ roomUrl: string }, Error, string>({
    mutationFn: joinMeeting,
    ...options,
  });
};
