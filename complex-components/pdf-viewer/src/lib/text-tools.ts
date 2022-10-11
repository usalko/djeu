export const postprocessingText = (text: string): string => {
    if (!text) {
        return text
    }
    return text.replaceAll('¬ ', '')
}