from django.db.models.fields import files
from django.core.exceptions import ValidationError
from django.db.models import signals
from sys import maxsize
from os import path
from logging import debug


class ImagePyramidField(files.ImageField):

    def __init__(
        self,
        verbose_name=None,
        name=None,
        # field is updating after post_init instance if field has None value, this field represent real width of image
        width_field=None,
        # field is updating after post_init instance if field has None value, this field represent real height of image
        height_field=None,
        miniature_max_width: int = 320,
        miniature_max_height: int = 240,
        representation_max_width: int = 800,
        representation_max_height: int = 600,
        **kwargs,
    ):
        self.miniature_max_width = miniature_max_width
        self.miniature_max_height = miniature_max_height
        self.representation_max_width = representation_max_width
        self.representation_max_height = representation_max_height
        super().__init__(verbose_name, name, **kwargs)

    def contribute_to_class(self, cls, name, **kwargs):
        super().contribute_to_class(cls, name, **kwargs)
        # Attach make_image_pyramid so that dimension fields declared
        # after their corresponding image field don't stay cleared by
        # Model.__init__, see bug #11196.
        # Only run post-initialization dimension update on non-abstract models
        if not cls._meta.abstract:
            signals.post_save.connect(self.make_image_pyramid, sender=cls)

    def make_image_pyramid(self, instance, force=False, *args, **kwargs):
        '''
        Create image pyramid with additional two levels, miniature and representation level.
        '''
        image_file = getattr(instance, self.attname)

        try:
            file_without_ext, file_ext = path.splitext(str(image_file.file))
            miniature = self.thumbnail(
                image_file.file, self.miniature_max_width, self.miniature_max_height)
            miniature_file_name = f'{file_without_ext}.miniature{file_ext}'
            miniature.save(miniature_file_name)
            debug(f'Save miniature {miniature_file_name}')
            miniature = self.thumbnail(
                image_file.file, self.representation_max_width, self.representation_max_height)
            representation_file_name = f'{file_without_ext}.representation{file_ext}'
            miniature.save(representation_file_name)
            debug(f'Save representation {representation_file_name}')
        except BaseException as e:
            # Pillow doesn't recognize it as an image.
            raise ValidationError(
                self.error_messages['invalid_image'],
                code='invalid_image',
            ) from e

    @classmethod
    def thumbnail(cls, file, width, height):
        from PIL import Image

        image = Image.open(file)
        width_ratio = width / \
            float(image.width) if image.width > width else 1.0
        height_ratio = height / \
            float(image.height) if image.height > height else 1.0

        if width_ratio < 1.0 and width_ratio <= height_ratio:
            image.thumbnail([width, maxsize], Image.BICUBIC)
        elif height_ratio < 1.0:
            image.thumbnail([maxsize, height], Image.BICUBIC)

        return image

    # def from_db_value(self, value, expression, connection):
    #     image_file_name = str(value)
    #     file_without_ext, file_ext = path.splitext(image_file_name)
    #     miniature_file_name = f'{file_without_ext}.miniature{file_ext}'
    #     representation_file_name = f'{file_without_ext}.representation{file_ext}'
    #     return dumps({
    #         'url': f'{file_without_ext}{file_ext}',
    #         'miniature': f'{miniature_file_name}',
    #         'representation': f'{representation_file_name}'
    #     })

