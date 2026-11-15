from django.conf import settings
from django.core.management.base import BaseCommand

from experiments.rag_engine import RAGEngine, gemini_config, mask_key
from services.errors import ServiceError


class Command(BaseCommand):
    help = "Checks that the Gemini API key is loaded and works."

    def handle(self, *args, **options):
        env_path = settings.BASE_DIR / ".env"
        self.stdout.write(f".env file: {env_path} -> {'FOUND' if env_path.exists() else 'NOT FOUND'}")
        cfg = gemini_config()
        self.stdout.write(f"API key : {mask_key(cfg['api_key']) or 'NOT SET'}")
        self.stdout.write(f"Model   : {cfg['model']}")
        try:
            self.stdout.write(self.style.SUCCESS(f"Gemini replied: {RAGEngine().ping()}"))
        except ServiceError as exc:
            self.stdout.write(self.style.ERROR(exc.message))
