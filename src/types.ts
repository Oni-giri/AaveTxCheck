// Define the input types and expected structure
export type Input = {
    chain: {
      id: number;
      rpc: string;
    };
    tx: {
      to: string;
      data: string;
      value: string;
    };
    boundaries: {
      allowedActor: string;
      healthFactor: number;
    };
  };

