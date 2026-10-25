"use client";

import useSWR from "swr";

import { ApiError, can, fetcher, type Permission, type User } from "./api";

/** The signed-in user: a User, null when signed out, undefined while unknown (loading, or the API
 * is unreachable — then `offline` is true and it keeps retrying, e.g. during a restart). */
export function useMe() {
  const { data, error, isLoading, mutate } = useSWR<User>("/auth/me", fetcher, {
    revalidateOnFocus: false,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err instanceof ApiError && err.status < 500) return; // signed out / forbidden: final
      setTimeout(() => revalidate({ retryCount }), Math.min(10000, 1000 * 2 ** retryCount));
    },
  });
  const signedOut = error instanceof ApiError && error.status === 401;
  const offline = !!error && !signedOut && !data;
  return { user: signedOut ? null : data, isLoading, mutate, offline };
}

/** Does the signed-in role have this permission? (The API enforces it too.) */
export function useCan(permission: Permission): boolean {
  return can(useMe().user, permission);
}
