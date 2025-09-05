"use client";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCreateMeetingMutation } from "@/hooks/useMeetings";
import { CreateRoomFormData } from "@/types";
import { useState } from "react";

const schema = yup.object().shape({
  title: yup
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters")
    .required("Title is required"),
  description: yup
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description must be less than 500 characters")
    .required("Description is required"),
  category: yup
    .string()
    .oneOf(
      ["general", "education", "business", "social", "gaming", "other"],
      "Please select a valid category"
    )
    .required("Category is required"),
  isPrivate: yup.boolean().required(),
  maxParticipants: yup
    .number()
    .min(2, "Minimum 2 participants required")
    .max(50, "Maximum 50 participants allowed")
    .required("Max participants is required"),
  recordingEnabled: yup.boolean().required(),
});

interface CreateMeetingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CreateMeetingForm = ({ onSuccess, onCancel }: CreateMeetingFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: createMeeting } = useCreateMeetingMutation({
    onSuccess: () => {
      setIsSubmitting(false);
      reset();
      onSuccess?.();
    },
    onError: (error) => {
      console.error("Failed to create meeting:", error);
      setIsSubmitting(false);
      setError("root", {
        message: "Failed to create meeting. Please try again.",
      });
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
    watch,
  } = useForm<CreateRoomFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: "",
      description: "",
      category: "general",
      isPrivate: false,
      maxParticipants: 10,
      recordingEnabled: false,
    },
  });

  const watchedIsPrivate = watch("isPrivate");

  const onSubmit = (data: CreateRoomFormData) => {
    setIsSubmitting(true);
    createMeeting(data);
  };

  const categories = [
    { value: "general", label: "General" },
    { value: "education", label: "Education" },
    { value: "business", label: "Business" },
    { value: "social", label: "Social" },
    { value: "gaming", label: "Gaming" },
    { value: "other", label: "Other" },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-black text-white border-2 border-black rounded-xl">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Create New Meeting
            </h2>
            <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
              Set up a new video conference room
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white"
          >
            Meeting Title *
          </label>
          <input
            id="title"
            type="text"
            className={`w-full px-4 py-3 border-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-300 ease-out ${
              errors.title
                ? "border-red-500"
                : "border-gray-200 dark:border-gray-700"
            }`}
            placeholder="Enter meeting title"
            {...register("title")}
            disabled={isSubmitting}
          />
          {errors.title && (
            <p className="text-sm mt-2 text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white"
          >
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            className={`w-full px-4 py-3 border-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-300 ease-out resize-none ${
              errors.description
                ? "border-red-500"
                : "border-gray-200 dark:border-gray-700"
            }`}
            placeholder="Describe what this meeting is about"
            {...register("description")}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="text-sm mt-2 text-red-500">
              {errors.description.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white"
            >
              Category *
            </label>
            <select
              id="category"
              className={`w-full px-4 py-3 border-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-300 ease-out ${
                errors.category
                  ? "border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              {...register("category")}
              disabled={isSubmitting}
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm mt-2 text-red-500">
                {errors.category.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="maxParticipants"
              className="block text-sm font-semibold mb-3 text-gray-900 dark:text-white"
            >
              Maximum Participants *
            </label>
            <input
              id="maxParticipants"
              type="number"
              min="2"
              max="50"
              className={`w-full px-4 py-3 border-2 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white transition-all duration-300 ease-out ${
                errors.maxParticipants
                  ? "border-red-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
              {...register("maxParticipants", { valueAsNumber: true })}
              disabled={isSubmitting}
            />
            {errors.maxParticipants && (
              <p className="text-sm mt-2 text-red-500">
                {errors.maxParticipants.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <input
              id="isPrivate"
              type="checkbox"
              className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 accent-black dark:accent-white"
              {...register("isPrivate")}
              disabled={isSubmitting}
            />
            <label
              htmlFor="isPrivate"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Private Meeting
            </label>
          </div>
          {watchedIsPrivate && (
            <div className="bg-white dark:bg-gray-900 border-2 border-yellow-500 rounded-md p-4">
              <p className="text-sm text-yellow-600 dark:text-yellow-400">
                Private meetings require an invitation link to join.
              </p>
            </div>
          )}

          <div className="flex items-center space-x-3">
            <input
              id="recordingEnabled"
              type="checkbox"
              className="w-5 h-5 border-2 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:ring-offset-2 accent-black dark:accent-white"
              {...register("recordingEnabled")}
              disabled={isSubmitting}
            />
            <label
              htmlFor="recordingEnabled"
              className="text-sm font-medium text-gray-900 dark:text-white"
            >
              Enable Recording
            </label>
          </div>
        </div>

        {errors.root && (
          <div className="bg-white dark:bg-gray-900 border-2 border-red-500 rounded-md p-4">
            <p className="text-sm text-center text-red-500">
              {errors.root.message}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-6">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="bg-white text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white hover:border-black transition-all duration-300 ease-out"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-white text-black border-2 border-black rounded-md px-4 py-2 font-medium hover:bg-black hover:text-white transition-all duration-300 ease-out flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="w-4 h-4 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span>Create Meeting</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateMeetingForm;
