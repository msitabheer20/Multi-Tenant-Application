import { ChatCompletionCreateParams } from "openai/resources/chat/completions";

export const functions: ChatCompletionCreateParams['tools'] = [
    {
        type: "function",
        function: {
            name: "change_theme",
            description: "Change the theme of the application",
            parameters: {
                type: "object",
                properties: {
                    theme: {
                        type: "string",
                        enum: ["light", "dark", "system"]
                    }
                },
                required: ["theme"]
            }
        }
    }
];

function change_theme(theme: string) {
    alert(`Changing theme to ${theme}`);
}

export async function runFunction(name: string, parameters: any) {
    if (name === "change_theme") {
        change_theme(parameters.theme);
    }
}
