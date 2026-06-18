export interface PromptDefinition<TInput> {
  build: (input: TInput) => string;
}
