export type TriggerRequest = {
  slug: string;
  context: string;
  origin: string;
};

export type TriggerResponse = {
  slug: string;
  status: string;
};

export type SegueRequest = {
  slug: string;
  output: string;
  operation: string;
};

export type SegueResponse = {
  success: boolean;
};
