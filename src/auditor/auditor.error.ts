export class AuditorError extends Error {
    constructor(value: unknown, type: string) {
        super(`The provided value "${value}" isn't a valid ${type} type`);
        this.name = 'AuditorError';
    }
}