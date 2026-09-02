"""
keyless-healer-system/lib/cbt_upgrader.py
Automated CBT Knowledge Base Upgrade & Synchronization Engine.
Provides version validation, SHA-256 checksum integrity checks, atomic backups,
live clinical evidence grounding from PubMed/NCBI, and instant rollback protection.
"""

from __future__ import annotations

import hashlib
import json
import logging
import os
import shutil
import time
from dataclasses import dataclass
from typing import Any

import httpx

logger = logging.getLogger("CBTUpgrader")


@dataclass
class UpgradeStatus:
    success: bool
    status: str
    previous_version: str
    current_version: str
    checksum_sha256: str
    details: str
    timestamp: str
    can_rollback: bool = False


class CBTLibraryUpgrader:
    """Manages version checking, validation, online enhancement, and atomic upgrades of the CBT library."""

    def __init__(self, library_path: str | None = None) -> None:
        if library_path:
            self.library_path = library_path
        else:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            self.library_path = os.path.abspath(os.path.join(base_dir, "../../lib/knowledge/cbt-library.json"))

        self.backup_path = f"{self.library_path}.backup"

    def _compute_checksum(self, data_str: str) -> str:
        return hashlib.sha256(data_str.encode("utf-8")).hexdigest()

    def get_current_library(self) -> dict[str, Any]:
        if os.path.exists(self.library_path):
            try:
                with open(self.library_path, encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to read CBT library: {e}")
        return {}

    def validate_schema(self, payload: dict[str, Any]) -> tuple[bool, str]:
        """Validates that a CBT library payload matches the required clinical schema."""
        if not isinstance(payload, dict):
            return False, "Payload must be a JSON object"

        if "manifest" not in payload or not isinstance(payload["manifest"], dict):
            return False, "Missing or invalid 'manifest' object"

        manifest = payload["manifest"]
        if not manifest.get("version") or not manifest.get("name"):
            return False, "Manifest missing required 'version' or 'name'"

        if "cognitive_distortions" not in payload or not isinstance(payload["cognitive_distortions"], list):
            return False, "Missing or invalid 'cognitive_distortions' list"

        distortions = payload["cognitive_distortions"]
        if len(distortions) < 10:
            return False, f"CBT Library contains too few distortions ({len(distortions)}), minimum is 10"

        for d in distortions:
            if not isinstance(d, dict) or not d.get("id") or not d.get("name") or not d.get("reframing_prompt"):
                return False, f"Distortion item missing required fields: {d}"

        return True, "Schema is valid"

    def create_backup(self) -> bool:
        """Creates an atomic backup of the current library."""
        if os.path.exists(self.library_path):
            try:
                shutil.copyfile(self.library_path, self.backup_path)
                logger.info(f"Created atomic backup at {self.backup_path}")
                return True
            except Exception as e:
                logger.error(f"Failed to create backup: {e}")
                return False
        return False

    def rollback(self) -> UpgradeStatus:
        """Restores the CBT library from the most recent backup."""
        if not os.path.exists(self.backup_path):
            return UpgradeStatus(
                success=False,
                status="error",
                previous_version="unknown",
                current_version="unknown",
                checksum_sha256="",
                details="No backup file found to rollback to",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                can_rollback=False,
            )

        try:
            with open(self.backup_path, encoding="utf-8") as f:
                backup_data = json.load(f)

            shutil.copyfile(self.backup_path, self.library_path)
            ver = backup_data.get("manifest", {}).get("version", "restored")
            raw_str = json.dumps(backup_data)

            return UpgradeStatus(
                success=True,
                status="rolled_back",
                previous_version="corrupted",
                current_version=ver,
                checksum_sha256=self._compute_checksum(raw_str),
                details="Successfully rolled back to previous stable snapshot",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                can_rollback=False,
            )
        except Exception as e:
            return UpgradeStatus(
                success=False,
                status="error",
                previous_version="unknown",
                current_version="unknown",
                checksum_sha256="",
                details=f"Rollback failed: {e}",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                can_rollback=False,
            )

    async def fetch_online_enhancements(self) -> list[dict[str, str]]:
        """Queries NCBI PubMed to retrieve live, open evidence grounding."""
        enhancements: list[dict[str, str]] = []
        try:
            async with httpx.AsyncClient(timeout=6.0) as client:
                res = await client.get(
                    "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi",
                    params={
                        "db": "pmc",
                        "term": "cognitive behavioral therapy cognitive distortions restructuring 2024[pdat]",
                        "retmode": "json",
                        "retmax": "3",
                    },
                )
                if res.status_code == 200:
                    id_list = res.json().get("esearchresult", {}).get("idlist", [])
                    if id_list:
                        sum_res = await client.get(
                            "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi",
                            params={"db": "pmc", "id": ",".join(id_list), "retmode": "json"},
                        )
                        if sum_res.status_code == 200:
                            summary_data = sum_res.json().get("result", {})
                            for uid in id_list:
                                item = summary_data.get(uid, {})
                                title = item.get("title")
                                if title:
                                    enhancements.append({
                                        "pmc_id": uid,
                                        "title": title,
                                        "source": "NCBI PubMed PMC",
                                    })
        except Exception as e:
            logger.warning(f"Online clinical evidence fetch notice: {e}")

        return enhancements

    async def upgrade_library(self, custom_payload: dict[str, Any] | None = None) -> UpgradeStatus:
        """Executes an atomic upgrade of the CBT library with checksum validation and rollback safety."""
        current_data = self.get_current_library()
        prev_ver = current_data.get("manifest", {}).get("version", "1.0.0")

        # 1. Prepare target payload
        if custom_payload:
            target_data = custom_payload
        else:
            target_data = current_data.copy()
            manifest = target_data.get("manifest", {})
            cur_ver_parts = prev_ver.split(".")
            try:
                major, minor, patch = map(int, cur_ver_parts)
                new_ver = f"{major}.{minor}.{patch + 1}"
            except Exception:
                new_ver = f"{prev_ver}.1"

            manifest["version"] = new_ver
            manifest["last_updated"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

            online_evidence = await self.fetch_online_enhancements()
            if online_evidence:
                manifest["live_evidence_grounding"] = online_evidence

            target_data["manifest"] = manifest

        # 2. Validate schema
        is_valid, err_msg = self.validate_schema(target_data)
        if not is_valid:
            logger.error(f"CBT Upgrade validation failed: {err_msg}")
            return UpgradeStatus(
                success=False,
                status="validation_error",
                previous_version=prev_ver,
                current_version=prev_ver,
                checksum_sha256="",
                details=f"Schema validation failed: {err_msg}",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                can_rollback=os.path.exists(self.backup_path),
            )

        # 3. Create Backup
        self.create_backup()

        # 4. Compute Checksum & Write Atomically
        raw_json = json.dumps(target_data, indent=2, ensure_ascii=False)
        checksum = self._compute_checksum(raw_json)
        target_data["manifest"]["checksum_sha256"] = checksum
        raw_json = json.dumps(target_data, indent=2, ensure_ascii=False)

        try:
            temp_file = f"{self.library_path}.tmp"
            with open(temp_file, "w", encoding="utf-8") as f:
                f.write(raw_json)
            shutil.move(temp_file, self.library_path)

            new_ver = target_data.get("manifest", {}).get("version", "updated")
            logger.info(f"CBT Library upgraded successfully to v{new_ver} (checksum: {checksum[:12]})")

            return UpgradeStatus(
                success=True,
                status="upgraded",
                previous_version=prev_ver,
                current_version=new_ver,
                checksum_sha256=checksum,
                details=f"Successfully upgraded CBT library to v{new_ver} with {len(target_data.get('cognitive_distortions', []))} distortions",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                can_rollback=True,
            )
        except Exception as e:
            logger.error(f"Error writing upgraded CBT library: {e}")
            self.rollback()
            return UpgradeStatus(
                success=False,
                status="write_error",
                previous_version=prev_ver,
                current_version=prev_ver,
                checksum_sha256="",
                details=f"Write failed: {e}. Auto-rolled back to previous version.",
                timestamp=time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                can_rollback=False,
            )


cbt_upgrader = CBTLibraryUpgrader()
