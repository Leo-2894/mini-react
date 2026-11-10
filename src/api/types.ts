export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export interface RequestRow { id: string; name: string; value: string; enabled: boolean }
export interface RequestDraft { method: string; url: string; params: RequestRow[]; headers: RequestRow[]; body: string }
export interface RequestSnapshot { readonly method: Method; readonly url: string; readonly headers: Readonly<Record<string, string>>; readonly body?: string }
export type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };
export interface ResponseData { status: number; statusText: string; ok: boolean; headers: { name: string; value: string }[]; text: string; format: 'empty' | 'text' | 'json'; json?: unknown; parseError: boolean }
export interface HTTPResult extends ResponseData { type: 'response'; elapsed: number }
export interface ErrorResult { type: 'error'; kind: 'network' | 'timeout' | 'aborted'; message: string; elapsed: number; status?: never }
export type RequestResult = HTTPResult | ErrorResult;
export interface DisplayBody { text: string; truncated: boolean }
export interface HistoryEntry { readonly id: string; readonly time: number; readonly method: Method; readonly url: string; readonly status: number | null; readonly elapsed: number }
export interface Job { id: string; time: number; snapshot: RequestSnapshot; timeout: number }
export type RequestTab = 'params' | 'headers' | 'body';
export type ResponseTab = 'body' | 'raw' | 'headers';
export interface AppState { draft: RequestDraft; tab: RequestTab; responseTab: ResponseTab; response: RequestResult | null; job: Job | null; loading: boolean; history: HistoryEntry[]; expanded: Record<string, boolean>; notice: string }
