import { BigNumber } from "ethers";
import BigQueryProvider from "@group-generators/helpers/providers/big-query/big-query";
import { ValueType, Tags, FetchedData, GroupWithData } from "topics/group";
import {
  GenerationContext,
  GenerationFrequency,
  GroupGenerator,
} from "topics/group-generator";

const generator: GroupGenerator = {
  generationFrequency: GenerationFrequency.Weekly,

  generate: async (context: GenerationContext): Promise<GroupWithData[]> => {
    const bigQueryProvider = new BigQueryProvider();

    const depositFunctionABI =
      "function deposit(bytes calldata pubkey, bytes calldata withdrawal_credentials, bytes calldata signature, bytes32 deposit_data_root) external payable";
    type DepositFunctionType = {
      pubkey: string;
      withdrawal_credentials: string;
      amount: string;
      signature: string;
      index: string;
    };

    // Mainnet eth2 Deposit contract address
    const contractAddress = "0x00000000219ab540356cBB839Cbe05303d7705Fa";
    const getEth2DepositTransactions =
      await bigQueryProvider.getAllTransactionsForSpecificMethod<DepositFunctionType>(
        {
          functionABI: depositFunctionABI,
          contractAddress,
          options: {
            blockNumber: context.blockNumber,
            functionArgs: false,
          },
        }
      );

    const data: FetchedData = {};

    // Sum the transactions for same address
    for (const transactions of getEth2DepositTransactions) {
      data[transactions.from] = BigNumber.from(
        data[transactions.from] ? data[transactions.from] : 0
      )
        .add(1)
        .toHexString();
    }

    return [
      {
        name: "eth2-depositors",
        timestamp: context.timestamp,
        data,
        valueType: ValueType.Score,
        tags: [Tags.Eth2],
      },
    ];
  },
};

export default generator;
