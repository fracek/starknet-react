import { devnet, mainnet } from "@starknet-react/chains";
import { AccountInterface, ProviderInterface, ProviderOptions } from "starknet";
import {
  Permission,
  RequestFnCall,
  RpcMessage,
  RpcTypeToMessageMap,
} from "starknet-types";
import {
  ConnectorNotConnectedError,
  ConnectorNotFoundError,
  UserRejectedRequestError,
} from "../errors";
import { Connector, ConnectorData, ConnectorIcons } from "./base";

export type MockConnectorOptions = {
  /** The wallet id. */
  id: string;
  /** Wallet human readable name. */
  name: string;
  /** Wallet icons. */
  icon?: ConnectorIcons;
  /** Whether the connector is available for use. */
  available?: boolean;
  /** Whether the connector should fail to connect. */
  failConnect?: boolean;
  /** Include account when switching chain. */
  unifiedSwitchAccountAndChain?: boolean;
  /** Emit change account event when switching chain. */
  emitChangeAccountOnChainSwitch?: boolean;
};

export type MockConnectorAccounts = {
  sepolia: AccountInterface[];
  mainnet: AccountInterface[];
};

// Icons used when the injected wallet is not found and no icon is provided.
// question-mark-circle from heroicons with color changed to black/white.
const WALLET_NOT_FOUND_ICON_LIGHT =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0iYmxhY2siPgogIDxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTkuODc5IDcuNTE5YzEuMTcxLTEuMDI1IDMuMDcxLTEuMDI1IDQuMjQyIDAgMS4xNzIgMS4wMjUgMS4xNzIgMi42ODcgMCAzLjcxMi0uMjAzLjE3OS0uNDMuMzI2LS42Ny40NDItLjc0NS4zNjEtMS40NS45OTktMS40NSAxLjgyN3YuNzVNMjEgMTJhOSA5IDAgMTEtMTggMCA5IDkgMCAwMTE4IDB6bS05IDUuMjVoLjAwOHYuMDA4SDEydi0uMDA4eiIgLz4KPC9zdmc+";
const WALLET_NOT_FOUND_ICON_DARK =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGZpbGw9Im5vbmUiIHZpZXdCb3g9IjAgMCAyNCAyNCIgc3Ryb2tlLXdpZHRoPSIxLjUiIHN0cm9rZT0id2hpdGUiPgogIDxwYXRoIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgZD0iTTkuODc5IDcuNTE5YzEuMTcxLTEuMDI1IDMuMDcxLTEuMDI1IDQuMjQyIDAgMS4xNzIgMS4wMjUgMS4xNzIgMi42ODcgMCAzLjcxMi0uMjAzLjE3OS0uNDMuMzI2LS42Ny40NDItLjc0NS4zNjEtMS40NS45OTktMS40NSAxLjgyN3YuNzVNMjEgMTJhOSA5IDAgMTEtMTggMCA5IDkgMCAwMTE4IDB6bS05IDUuMjVoLjAwOHYuMDA4SDEydi0uMDA4eiIgLz4KPC9zdmc+Cg==";

//  Icons used when the injected wallet is not installed
//  Icons from media kits
const walletIcons = {
  argentX:
    "data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDI0LjAuMSwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPgo8c3ZnIHZlcnNpb249IjEuMSIgaWQ9IkxheWVyXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4IgoJIHZpZXdCb3g9IjAgMCA2NS4xOTUwOCA1Ny43MzU2MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNjUuMTk1MDggNTcuNzM1NjI7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4KPHN0eWxlIHR5cGU9InRleHQvY3NzIj4KCS5zdDB7ZmlsbDojRkY4NzVCO30KPC9zdHlsZT4KPHBhdGggY2xhc3M9InN0MCIgZD0iTTQwLjk4NTkyLDBIMjQuMjA4ODhjLTAuNTYsMC0xLjAxMDAxLDAuNDUxMDItMS4wMjE5NywxLjAxMjAyCgljLTAuMzM4OTksMTUuNzU1LTguNTgyMDMsMzAuNzA4OTgtMjIuNzcwMDIsNDEuMzAwOTljLTAuNDUwMDEsMC4zMzcwMS0wLjU1Mjk4LDAuOTY3OTktMC4yMjQsMS40MjNsOS44MTU5OCwxMy41NzMKCWMwLjMzNDA1LDAuNDYyMDEsMC45ODUwNSwwLjU2NTk4LDEuNDQyOTksMC4yMjY5OWM4Ljg3MTAzLTYuNTc5MDEsMTYuMDA3MDItMTQuNTE3LDIxLjE0NjA2LTIzLjMxNQoJYzUuMTM4LDguNzk4LDEyLjI3Mzk5LDE2LjczNTk5LDIxLjE0NiwyMy4zMTVjMC40NTY5NywwLjMzODk5LDEuMTA3OTcsMC4yMzUwMiwxLjQ0MTk2LTAuMjI2OTlsOS44MTYwNC0xMy41NzMKCWMwLjMyODk4LTAuNDU1MDIsMC4yMjY5OS0xLjA4Ni0wLjIyNC0xLjQyM0M1MC41ODk4NiwzMS43MjEwMSw0Mi4zNDY4OCwxNi43NjcwMyw0Mi4wMDc4OSwxLjAxMjAyCglDNDEuOTk1ODcsMC40NTEwMiw0MS41NDY4OSwwLDQwLjk4NTkyLDAiLz4KPC9zdmc+Cg==",
  braavos:
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0zMjMuNDQgNDEuMzg4NkMzMjQuMTk4IDQyLjY3MjggMzIzLjE5NSA0NC4yNjAzIDMyMS43MDQgNDQuMjYwM0MyOTEuNTEgNDQuMjYwMyAyNjYuOTY1IDY4LjE2NTYgMjY2LjM4OSA5Ny44NzFDMjU2LjA1IDk1Ljk0MDcgMjQ1LjMzNyA5NS43OTU2IDIzNC43NTQgOTcuNTc4N0MyMzQuMDIzIDY4LjAwOSAyMDkuNTQgNDQuMjYwMyAxNzkuNDQ1IDQ0LjI2MDNDMTc3Ljk1MyA0NC4yNjAzIDE3Ni45NDkgNDIuNjcxNiAxNzcuNzA3IDQxLjM4NjVDMTkyLjMyMyAxNi42MzMgMjE5LjQ4MyAwIDI1MC41NzMgMEMyODEuNjY0IDAgMzA4LjgyNCAxNi42MzM5IDMyMy40NCA0MS4zODg2WiIgZmlsbD0idXJsKCNwYWludDBfbGluZWFyXzIzMjRfNjE4NjkpIi8+CjxwYXRoIGQ9Ik00MTguNzU2IDIyNi44OTRDNDI2LjM3IDIyOS4yIDQzMy41ODEgMjIyLjUxNyA0MzEuMDM2IDIxNC45NzlDNDA0LjUwNyAxMzYuNDAxIDMxNi41MzUgMTA0LjM1OCAyNTAuMTU5IDEwNC4zNThDMTgzLjY3NCAxMDQuMzU4IDkzLjczOTEgMTM3LjQxOCA2OS4zMDUxIDIxNS4zMzFDNjYuOTU3NCAyMjIuODE4IDc0LjE0NjUgMjI5LjI3NSA4MS42NDc5IDIyNi45NzdMMjQ0LjI1IDE3Ny4xNTFDMjQ3LjU2OSAxNzYuMTM0IDI1MS4xMTYgMTc2LjEyOCAyNTQuNDM5IDE3Ny4xMzVMNDE4Ljc1NiAyMjYuODk0WiIgZmlsbD0idXJsKCNwYWludDFfbGluZWFyXzIzMjRfNjE4NjkpIi8+CjxwYXRoIGQ9Ik02OS43MTY1IDIzOS40MjZMMjQ0LjM3IDE4Ni40NTZDMjQ3LjY2OSAxODUuNDU2IDI1MS4xOTEgMTg1LjQ1MyAyNTQuNDkyIDE4Ni40NDhMNDMwLjIzMiAyMzkuNDUyQzQ0NC43NiAyNDMuODMzIDQ1NC43MDEgMjU3LjIxNiA0NTQuNzAxIDI3Mi4zOVY0MzAuNDgxQzQ1NC4wMjggNDY5LjA3IDQxOS4zNjIgNTAwIDM4MC43ODYgNTAwSDMxNi43MTJDMzEwLjM3OSA1MDAgMzA1LjI1IDQ5NC44NzcgMzA1LjI1IDQ4OC41NDNWNDMzLjExNUMzMDUuMjUgNDExLjI4OSAzMTguMTY3IDM5MS41MzUgMzM4LjE1NSAzODIuNzkyQzM2NC45NDkgMzcxLjA3MSAzOTYuNjQ2IDM1NS4yMTggNDAyLjYwOCAzMjMuNDA2QzQwNC41MzIgMzEzLjEzOCAzOTcuODM3IDMwMy4yMzQgMzg3LjU5NSAzMDEuMTk4QzM2MS42OTkgMjk2LjA1MSAzMzIuOTg5IDI5OC4wMzkgMzA4LjcxMSAzMDguODk4QzI4MS4xNSAzMjEuMjI1IDI3My45NCAzNDEuNzMxIDI3MS4yNzEgMzY5LjI3TDI2OC4wMzYgMzk4LjkzOEMyNjcuMDQ3IDQwOC4wMDUgMjU4LjU0NiA0MTQuOTUyIDI0OS40MjkgNDE0Ljk1MkMyMzkuOTk4IDQxNC45NTIgMjMyLjkyNiA0MDcuNzY5IDIzMS45MDMgMzk4LjM4OEwyMjguNzI4IDM2OS4yN0MyMjYuNDQyIDM0NS42ODEgMjIyLjI5OCAzMjIuNzY3IDE5Ny45MTIgMzExLjg2QzE3MC4wOTUgMjk5LjQxOSAxNDIuMTQxIDI5NS4yODcgMTEyLjQwNCAzMDEuMTk4QzEwMi4xNjIgMzAzLjIzNCA5NS40NjcgMzEzLjEzOCA5Ny4zOTEzIDMyMy40MDZDMTAzLjQwNSAzNTUuNDk1IDEzNC44NTQgMzcwLjk4NSAxNjEuODQ0IDM4Mi43OTJDMTgxLjgzMyAzOTEuNTM1IDE5NC43NSA0MTEuMjg5IDE5NC43NSA0MzMuMTE1VjQ4OC41MzNDMTk0Ljc1IDQ5NC44NjcgMTg5LjYyMiA1MDAgMTgzLjI4OSA1MDBIMTE5LjIxNEM4MC42Mzc0IDUwMCA0NS45NzE2IDQ2OS4wNyA0NS4yOTc5IDQzMC40ODFWMjcyLjM0OUM0NS4yOTc5IDI1Ny4xOTQgNTUuMjE0MiAyNDMuODI0IDY5LjcxNjUgMjM5LjQyNloiIGZpbGw9InVybCgjcGFpbnQyX2xpbmVhcl8yMzI0XzYxODY5KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDBfbGluZWFyXzIzMjRfNjE4NjkiIHgxPSIyNDUuOTg2IiB5MT0iLTI3IiB4Mj0iNDI1LjQ5NiIgeTI9IjUwMi4zNzYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y1RDQ1RSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRjk2MDAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDFfbGluZWFyXzIzMjRfNjE4NjkiIHgxPSIyNDUuOTg2IiB5MT0iLTI3IiB4Mj0iNDI1LjQ5NiIgeTI9IjUwMi4zNzYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y1RDQ1RSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRjk2MDAiLz4KPC9saW5lYXJHcmFkaWVudD4KPGxpbmVhckdyYWRpZW50IGlkPSJwYWludDJfbGluZWFyXzIzMjRfNjE4NjkiIHgxPSIyNDUuOTg2IiB5MT0iLTI3IiB4Mj0iNDI1LjQ5NiIgeTI9IjUwMi4zNzYiIGdyYWRpZW50VW5pdHM9InVzZXJTcGFjZU9uVXNlIj4KPHN0b3Agc3RvcC1jb2xvcj0iI0Y1RDQ1RSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiNGRjk2MDAiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4=",
};

export class MockConnector extends Connector {
  private _accounts: MockConnectorAccounts;
  private _accountIndex = 0;
  private _options: MockConnectorOptions;
  private _connected = false;
  private _chainId: bigint = devnet.id;

  constructor({
    accounts,
    options,
  }: {
    accounts: MockConnectorAccounts;
    options: MockConnectorOptions;
  }) {
    super();

    if (accounts.mainnet.length === 0 || accounts.sepolia.length === 0) {
      throw new Error("MockConnector: accounts must not be empty");
    }

    this._accounts = accounts;
    this._options = options;
  }

  switchChain(chainId: bigint): void {
    this._chainId = chainId;
    this._accountIndex = 0;
    let account;
    if (this._options.unifiedSwitchAccountAndChain) {
      account = this._account.address;
    }

    this.emit("change", { chainId, account });

    if (this._options.emitChangeAccountOnChainSwitch ?? true) {
      this.switchAccount(this._accountIndex);
    }
  }

  switchAccount(accountIndex: number): void {
    this._accountIndex = accountIndex;
    this.emit("change", { account: this._account.address });
  }

  get id(): string {
    return this._options.id;
  }

  get name(): string {
    return this._options.name;
  }

  get icon(): ConnectorIcons {
    let deafultIcon = {
      dark:
        walletIcons[this.id as keyof typeof walletIcons] ||
        WALLET_NOT_FOUND_ICON_DARK,
      light:
        walletIcons[this.id as keyof typeof walletIcons] ||
        WALLET_NOT_FOUND_ICON_LIGHT,
    };

    return this._options.icon || deafultIcon;
  }

  available(): boolean {
    return this._options.available ?? true;
  }

  async chainId(): Promise<bigint> {
    const chainIdHex = await this.request({ type: "wallet_requestChainId" });
    const chainId = BigInt(chainIdHex);
    return chainId;
  }

  async ready(): Promise<boolean> {
    const permissions: Permission[] = await this.request({
      type: "wallet_getPermissions",
    });
    if (!permissions?.includes(Permission.Accounts)) {
      return false;
    } else return true;
  }

  async connect(): Promise<ConnectorData> {
    if (this._options.failConnect) {
      throw new UserRejectedRequestError();
    }

    this._connected = true;

    let accounts = await this.request({
      type: "wallet_requestAccounts",
      params: { silent_mode: true },
    });

    const chainId = await this.chainId();

    let [account] = accounts;

    return { account, chainId };
  }

  async disconnect(): Promise<void> {
    this._connected = false;

    this.emit("disconnect");
  }

  async request<T extends RpcMessage["type"]>(
    call: RequestFnCall<T>
  ): Promise<RpcTypeToMessageMap[T]["result"]> {
    const { type, params } = call;

    if (!this.available()) {
      throw new ConnectorNotFoundError();
    }
    switch (type) {
      case "wallet_requestChainId":
        return this._chainId.toString();
      case "wallet_getPermissions":
        if (this._connected) return [Permission.Accounts];
        else return [];
      case "wallet_requestAccounts":
        return [this._account.address];
      default:
        throw new Error("Unknown request type");
    }
  }

  async account(
    provider: ProviderOptions | ProviderInterface
  ): Promise<AccountInterface> {
    if (!this.available()) {
      throw new ConnectorNotFoundError();
    }

    if (!this._connected) {
      throw new ConnectorNotConnectedError();
    }

    return this._account;
  }

  private get _account(): AccountInterface {
    let account;
    if (this._chainId === mainnet.id) {
      account = this._accounts.mainnet[this._accountIndex];
    } else {
      account = this._accounts.sepolia[this._accountIndex];
    }

    if (!account) {
      throw new ConnectorNotConnectedError();
    }

    return account;
  }
}
