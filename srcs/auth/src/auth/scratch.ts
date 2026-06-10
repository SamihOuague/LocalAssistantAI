import { createHash, randomInt } from 'node:crypto';

const SCRATCH_CODE_COUNT = 10;
const SCRATCH_CODE_GROUPS = 3;
const SCRATCH_CODE_GROUP_LEN = 4;
const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

function sha256Hex(input: string): string {
	return createHash('sha256').update(input).digest('hex');
}

export function normalizeScratchCode(raw: string): string {
	return raw.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function generateScratchCodes(): { plaintext: string[]; hashes: string[] } {
	const plaintext: string[] = [];
	const hashes: string[] = [];

	for (let i = 0; i < SCRATCH_CODE_COUNT; i++)
	{
		const groups: string[] = [];
		for (let g = 0; g < SCRATCH_CODE_GROUPS; g++)
		{
			let group = '';
			for (let c = 0; c < SCRATCH_CODE_GROUP_LEN; c++)
			{
				group += ALPHABET[randomInt(ALPHABET.length)];
			}
			groups.push(group);
		}
		const display = groups.join('-');                 // e.g. "a7f2-9k3b-x1m0"
		plaintext.push(display);
		hashes.push(sha256Hex(normalizeScratchCode(display)));
	}

	return { plaintext, hashes };
}
