import { removeOldWorkerJobsJob } from "./removeOldWorkerJobs"
import { syncLumaEventsJob } from "./syncLumaEvents"
import type { JobRegistry } from "./types"

export const jobRegistry: JobRegistry = {
  removeOldWorkerJobs: removeOldWorkerJobsJob,
  syncLumaEvents: syncLumaEventsJob,
}

export { removeOldWorkerJobsJob } from "./removeOldWorkerJobs"
export { syncLumaEventsJob } from "./syncLumaEvents"
