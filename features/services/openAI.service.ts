import OpenAI from "openai";

export interface TemplateReference {
    promptId: string;
    version: string;
}

export class OpenAIService {
    constructor(private readonly openAIClient: OpenAI = new OpenAI()) { }

    async generateQuestions(template: TemplateReference, variables: any): Promise<string> {
        const { promptId, version } = template;
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) throw new Error('API key not configured');
        this.openAIClient.apiKey = apiKey;

        const response = await this.openAIClient.responses.create({
            model: 'gpt-5-nano',
            prompt: {
                id: promptId,
                version,
                variables,
            },
        });

        return response?.output_text;
    }
}
