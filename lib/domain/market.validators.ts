import {z} from 'zod';
export const CounterpartySchema=z.object({name:z.string(),type:z.string(),jurisdiction:z.string().optional()});
export const DealSchema=z.object({title:z.string(),status:z.string(),counterparty_id:z.string().optional()});