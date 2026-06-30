const waiters = new Map();

export const waitForStream = (jobId) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            waiters.delete(jobId);
            reject(
                new Error("Stream timeout")
            );
        }, 30000);
        
        waiters.set(jobId, () => {
            clearTimeout(timer);
            resolve();
        });
    });
}

export const markStreamReady = (jobId) => {
    const resolve = waiters.get(jobId);

    if (resolve) {
        resolve();
        waiters.delete(jobId);
    }
}