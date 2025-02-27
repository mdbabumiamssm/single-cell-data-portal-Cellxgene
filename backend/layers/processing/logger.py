import logging
import os
import sys
from contextlib import suppress

from pythonjsonlogger import jsonlogger

from backend.common.logging_config import DATETIME_FORMAT, LOG_FORMAT

logger = logging.getLogger("processing")


def configure_logging(level=None):
    level = getattr(logging, os.environ.get("LOG_LEVEL", "INFO").upper())
    log_stdout_handler = logging.StreamHandler(stream=sys.stdout)
    formatter = jsonlogger.JsonFormatter(LOG_FORMAT, DATETIME_FORMAT)
    log_stdout_handler.setFormatter(formatter)
    logging.basicConfig(handlers=[log_stdout_handler], level=level, force=True)
    logging.getLogger("botocore").setLevel(max([logging.INFO, level]))  # don't set boto3 less than INFO
    logging.getLogger("s3transfer").setLevel(max([logging.INFO, level]))


def logit(func):
    def wrapper(*arg, **kw):
        """Logging the start and finish of a function"""
        logger.info(f"Start {func.__name__}", extra={"type": "METRIC"})
        res = func(*arg, **kw)
        logger.info(f"Complete {func.__name__}", extra={"type": "METRIC"})
        return res

    return wrapper


class LogSuppressed(suppress):
    def __init__(self, *args, message="Suppressed Exception"):
        super().__init__(*args)
        self.message = message

    def __exit__(self, exc_type, exc_value, traceback):
        if exc_type is not None:
            logger.error(self.message, exc_info=(exc_type, exc_value, traceback))
        return super().__exit__(exc_type, exc_value, traceback)
