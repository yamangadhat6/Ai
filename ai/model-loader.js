import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.0.2';

// السماح بتحميل النماذج عن بعد وتخزينها في كاش المتصفح المحلي (Cache API)
env.allowRemoteModels = true;
env.allowLocalModels = false;

class AIModelLoader {
    constructor() {
        this.generator = null;
        // نموذج خفيف ومثالي للتشغيل داخل المتصفح والآيباد (~90MB فقط)
        this.modelId = 'HuggingFaceTB/SmolLM2-135M-Instruct';
    }

    async loadModel(onProgressCallback) {
        if (this.generator) return this.generator;

        try {
            this.generator = await pipeline('text-generation', this.modelId, {
                dtype: 'q4', // ضغط النموذج ليعمل بسلاسة وبأقل استهلاك لذاكرة الـ RAM
                device: 'wasm', // تشغيل فوري متوافق مع Safari على الآيباد
                progress_callback: (progressData) => {
                    if (onProgressCallback && progressData.status === 'progress') {
                        onProgressCallback(Math.round(progressData.progress || 0));
                    }
                }
            });
            return this.generator;
        } catch (error) {
            console.error("فشل تحميل نموذج الذكاء الاصطناعي:", error);
            throw error;
        }
    }

    async generate(messages, maxTokens = 120) {
        if (!this.generator) {
            throw new Error("النموذج لم يتم تحميله بعد!");
        }

        // صياغة الـ Prompt بنظام الـ Chat
        const formattedPrompt = messages.map(m => `<|im_start|>${m.role}\n${m.content}<|im_end|>`).join('\n') + '\n<|im_start|>assistant\n';

        const output = await this.generator(formattedPrompt, {
            max_new_tokens: maxTokens,
            temperature: 0.7,
            top_k: 50,
            do_sample: true,
            return_full_text: false
        });

        return output[0].generated_text.replace(/<\|im_end\|>/g, '').trim();
    }
}

export const ai = new AIModelLoader();
