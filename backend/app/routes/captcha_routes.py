import logging
import base64

from flask import Blueprint, jsonify
from app.services.captcha_service import create_captcha
from app.security.rate_limit import rate_limit
from app.utils.errors import ApiError, ErrorCode

captcha_v2_bp = Blueprint('captcha_v2_unique', __name__)
_log = logging.getLogger(__name__)

@captcha_v2_bp.route('/generate', methods=['GET'])
@rate_limit('captcha_generate')
def get_captcha():
    try:
        captcha_key, image_data = create_captcha()
        image_data.seek(0)
        encoded_image = base64.b64encode(image_data.read()).decode('utf-8')
        image_uri = f"data:image/png;base64,{encoded_image}"
        
        return jsonify({
            'key': captcha_key,
            'image': image_uri
        })
    except Exception as exc:
        # Exception text may contain filesystem paths, provider details, or
        # other sensitive values. Keep only its type in the operational log.
        _log.error("captcha image generation failed error_type=%s", type(exc).__name__)
        raise ApiError(500, ErrorCode.INTERNAL, "Daxili server xətası") from None
