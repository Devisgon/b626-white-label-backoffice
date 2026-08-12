// Re-exported from the AsyncLocalStorage-backed store so existing banking
// module code (`import type { RequestContext } from '.../request-context.interface'`)
// keeps working unchanged after the merge.
export type { RequestContext } from '../context/request-context.store';
