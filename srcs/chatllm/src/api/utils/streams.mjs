const streams = new Map();

export const registerStream = (jobId, res) => {
    streams.set(jobId, res);
}

export const getStream = (jobId) => {
    return streams.get(jobId);
}

export const deleteStream = (jobId) => {
    streams.delete(jobId);
}