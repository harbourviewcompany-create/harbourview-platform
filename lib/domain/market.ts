export type Counterparty={id:string,name:string,type:string,jurisdiction?:string};
export type Deal={id:string,title:string,status:string,counterparty_id?:string};
export type Signal={id:string,title:string,score:number};