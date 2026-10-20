export type AuditorResult<T, R extends boolean | undefined> = R extends true
?   T
:   T | undefined;