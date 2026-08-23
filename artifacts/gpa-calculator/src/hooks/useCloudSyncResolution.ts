import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { hasMeaningfulRecord, hasResolvedSyncForUser, mapApiSemesters, markSyncResolvedForUser, mergeSemesters, type SyncChoice } from "@/lib/sync-resolution";
import { useGpaStore, type Semester } from "@/lib/store";
import { useGpaActions } from "./useGpaActions";

export interface SyncConflict {
  local: Semester[];
  remote: Semester[];
}

export function useCloudSyncResolution() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const localSemesters = useGpaStore((state) => state.semesters);
  const loadFromApi = useGpaStore((state) => state.loadFromApi);
  const { importSemesters } = useGpaActions();
  const checkedUser = useRef<string | null>(null);
  const [conflict, setConflict] = useState<SyncConflict | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const userKey = user?.id;
    if (isLoading || !isAuthenticated || !userKey || checkedUser.current === userKey || hasResolvedSyncForUser(userKey)) return;
    checkedUser.current = userKey;
    let active = true;

    api.getSemesters()
      .then(({ semesters: remoteSemesters }) => {
        if (!active) return;
        const remote = mapApiSemesters(remoteSemesters);
        const localHasData = hasMeaningfulRecord(localSemesters);
        const remoteHasData = hasMeaningfulRecord(remote);

        if (localHasData) {
          setConflict({ local: localSemesters, remote });
          return;
        }

        if (remoteHasData) loadFromApi(remote);
        markSyncResolvedForUser(userKey);
      })
      .catch(() => {
        if (active) setError("We could not compare your local and cloud records. Your local data is still safe in this browser.");
      });

    return () => {
      active = false;
    };
  }, [isAuthenticated, isLoading, loadFromApi, localSemesters, user?.id]);

  const resolve = useCallback(async (choice: SyncChoice) => {
    if (!conflict || !user?.id) return;
    setIsWorking(true);
    setError(null);
    try {
      if (choice === "cloud") {
        loadFromApi(conflict.remote);
      } else if (choice === "local") {
        await importSemesters(conflict.local);
      } else if (choice === "merge") {
        await importSemesters(mergeSemesters(conflict.local, conflict.remote));
      } else {
        loadFromApi(conflict.local);
      }
      markSyncResolvedForUser(user.id);
      setConflict(null);
    } catch {
      setError("The sync choice could not be completed. Nothing was removed; please try again.");
    } finally {
      setIsWorking(false);
    }
  }, [conflict, importSemesters, loadFromApi, user?.id]);

  return {
    conflict,
    isWorking,
    error,
    resolve,
  };
}
