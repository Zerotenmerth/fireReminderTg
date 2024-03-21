import { CronJob } from 'cron';

export function startJob(start, func)
{
    const job= new CronJob(start, func, null, true, 'Europe/Kiev');
	return job;
}

export function Random(min, max) 
{
	let rand = min + Math.random() * (max + 1 - min);
	rand = Math.floor(rand);
	return rand;
}