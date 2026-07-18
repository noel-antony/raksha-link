"""
RakshaLink API - Logger Utility

Provides a reusable, pre-configured logger for the application.
"""

import logging
import sys


def get_logger(name: str = "rakshalink") -> logging.Logger:
    """Return a configured logger instance.

    Args:
        name: Logger name, typically the module's __name__.

    Returns:
        A logging.Logger with stdout handler and consistent formatting.
    """
    logger = logging.getLogger(name)

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        formatter = logging.Formatter(
            "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S",
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.setLevel(logging.DEBUG)

    return logger
