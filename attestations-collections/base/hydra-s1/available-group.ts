import { SNARK_FIELD } from "@sismo-core/crypto";
import { BigNumber, ethers } from "ethers";
import { MerkleTreeHandler } from "./helpers";
import { AccountTree, HydraS1AvailableGroupProperties } from ".";
import { FileStore } from "file-store";
import { ChunkedData } from "helpers";
import { GroupWithInternalCollectionId } from "topics/attester";
import { Group, ValueType } from "topics/group";

const MAX_CHUNK_SIZE = 50000;

export class HydraS1AvailableGroup {
  public readonly groupId: string;
  public readonly properties: HydraS1AvailableGroupProperties;

  protected group: Group;
  protected fileStore: FileStore;

  constructor(
    fileStore: FileStore,
    groupWithId: GroupWithInternalCollectionId
  ) {
    this.fileStore = fileStore;
    this.group = groupWithId.group;
    this.properties = {
      internalCollectionId: groupWithId.internalCollectionId,
      generationTimestamp: this.group.timestamp,
      isScore: this.group.valueType == ValueType.Score,
    };
    this.groupId = this.getGroupId();
  }

  public async compute(chunkSize?: number): Promise<AccountTree[]> {
    const accountTrees: AccountTree[] = [];
    const groupData = await this.group.data();
    const chunkedData = new ChunkedData(groupData, chunkSize ?? MAX_CHUNK_SIZE);
    const groupDataFilename = `${this.groupId}.group.json`;
    await this.fileStore.write(groupDataFilename, groupData);
    for (const chunk of chunkedData.iterate()) {
      // add groupId: 0 in the group to allow the creation of different account trees root
      // for same generated groups but different group Ids
      chunk.data[this.groupId] = "0";
      const merkleTree = new MerkleTreeHandler(this.fileStore, chunk.data);
      const root = await merkleTree.compute();
      accountTrees.push({
        root: root,
        groupId: this.groupId,
        chunk: chunk.metadata,
        groupProperties: this.properties,
        metadata: {
          ...merkleTree.metadata,
          groupDataUrl: this.fileStore.url(groupDataFilename),
        },
        dataUrl: this.fileStore.url(merkleTree.dataFilename),
        treeUrl: this.fileStore.url(merkleTree.treeFilename),
      });
    }
    return accountTrees;
  }

  protected getGroupId(): string {
    return BigNumber.from(
      ethers.utils.keccak256(
        ethers.utils.defaultAbiCoder.encode(
          ["uint128", "uint32", "bool"],
          [
            this.properties.internalCollectionId,
            this.properties.generationTimestamp,
            this.properties.isScore,
          ]
        )
      )
    )
      .mod(SNARK_FIELD)
      .toHexString();
  }
}
