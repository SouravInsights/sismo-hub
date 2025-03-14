// nocommit
import { Network } from "topics/attester";
import { BadgesCollection } from "topics/badge";

export const pythia1LocalBadges: BadgesCollection = {
  collectionIdFirsts: {
    [Network.Local]: 30000001,
  },
  badges: [
    {
      internalCollectionId: 0,
      name: "Synaps Liveness ZK Badge",
      description:
        "ZK Badge owned by users that proved their liveness with Synaps",
      image: "synaps_liveness.svg",
      publicContacts: [{
        type: "github",
        contact: "leosayous21"
      }],
      eligibility: {
        shortDescription: "Prove your Liveness with Synaps",
        specification: "",
      },
      links: [
        {
          logoUrl: "",
          label: "Synaps",
          url: "https://synaps.io/"
        }
      ]
    },
  ],
};
