# from modeltranslation.translator import translator, TranslationOptions
# from contact_form.models import Subject


class SubjectTranslationOptions:
    fields = ('title', 'description')
    fallback_languages = {'default': ('en',)}


# translator.register(Subject, SubjectTranslationOptions)
