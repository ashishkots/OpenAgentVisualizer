from enum import Enum


class ExportFormat(str, Enum):
    csv = "csv"
    json = "json"
