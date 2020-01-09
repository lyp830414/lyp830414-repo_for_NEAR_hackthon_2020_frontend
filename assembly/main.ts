//@nearfile
import { context, storage, logging, collections, PersistentMap } from "near-runtime-ts";

// --- contract code goes below
let balances = new PersistentMap<string, u64>("b:");
let approves = new PersistentMap<string, u64>("a:");
let points = new PersistentMap<string, u64>("p:");
let RATE: u64 = 100;
let TOTAL_SUPPLY: u64 = 1000000;
let VAULT: string = "vault"

export function increasePoint(owner: string, value: u64): void {
  let point = points.contains(owner) ? points.getSome(owner) : 0;
  let newPoint = point + value;
  points.set(owner, newPoint)
  logging.log("Point of " + owner + " is now: " + newPoint.toString());
}

export function exchange(value: u64): void {
  logging.log("Exchanging " + value.toString() + " points");
  let point = points.contains(context.sender) ? points.getSome(context.sender) : 0;
  assert(point >= value, "not enough points on account");
  let newToken = value / RATE;
  let newPoint = point - value;
  points.set(context.sender, newPoint);

  let balance = balances.contains(context.sender) ? balances.getSome(context.sender) : 0;
  let newBalance = balance + newToken;
  balances.set(context.sender, newBalance)

  let vault = balances.contains(VAULT) ? balances.getSome(VAULT) : 0;
  let newVault = vault - newToken;
  balances.set(VAULT, newVault)
}

export function getPoint(owner: string) : u64 {
  return points.contains(owner) ? points.getSome(owner) : 0;
}

export function init(): void {
  logging.log("minting tokens to the vault");
  assert(storage.get<string>("init") == null, "Already initialized token supply");
  balances.set(VAULT, TOTAL_SUPPLY);
  storage.set<string>("init", "done");
}

export function totalSupply(): string {
  return TOTAL_SUPPLY.toString();
}

export function balanceOf(tokenOwner: string): u64 {
  logging.log("balanceOf: " + tokenOwner);
  if (!balances.contains(tokenOwner)) {
    return 0;
  }
  let result = balances.getSome(tokenOwner);
  return result;
}

export function allowance(tokenOwner: string, spender: string): u64 {
  const key = tokenOwner + ":" + spender;
  if (!approves.contains(key)) {
    return 0;
  }
  return approves.getSome(key);
}

export function transfer(to: string, tokens: u64): boolean {
  logging.log("transfer from: " + context.sender + " to: " + to + " tokens: " + tokens.toString());
  let fromAmount = getBalance(context.sender);
  assert(fromAmount >= tokens, "not enough tokens on account");
  balances.set(context.sender, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

export function approve(spender: string, tokens: u64): boolean {
  logging.log("approve: " + spender + " tokens: " + tokens.toString());
  approves.set(context.sender + ":" + spender, tokens);
  return true;
}

export function transferFrom(from: string, to: string, tokens: u64): boolean {
  let fromAmount = getBalance(from);
  assert(fromAmount >= tokens, "not enough tokens on account");
  let approvedAmount = allowance(from, to);
  assert(tokens <= approvedAmount, "not enough tokens approved to transfer");
  balances.set(from, fromAmount - tokens);
  balances.set(to, getBalance(to) + tokens);
  return true;
}

function getBalance(owner: string) : u64 {
  return balances.contains(owner) ? balances.getSome(owner) : 0;
}
