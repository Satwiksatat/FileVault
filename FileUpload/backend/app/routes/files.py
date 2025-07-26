import os
from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from .. import db, minio_client
from ..models import File, Group, GroupMembership, User
from io import BytesIO

files_bp = Blueprint('files', __name__)

@files_bp.route('/<int:group_id>/upload', methods=['POST'])
@jwt_required()
def upload_file(group_id):
    user_id = get_jwt_identity()
    if not GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'msg': 'Not a group member'}), 403
    if 'file' not in request.files:
        return jsonify({'msg': 'No file part'}), 400
    file = request.files['file']
    filename = secure_filename(file.filename)
    minio_key = f"group_{group_id}/{filename}"
    minio_client.put_object(
        os.getenv('MINIO_BUCKET'),
        minio_key,
        file,
        length=-1,
        part_size=10*1024*1024
    )
    db_file = File(filename=filename, minio_key=minio_key, group_id=group_id, uploader_id=user_id)
    db.session.add(db_file)
    db.session.commit()
    return jsonify({'msg': 'File uploaded', 'file_id': db_file.id}), 201

@files_bp.route('/<int:group_id>/list', methods=['GET'])
@jwt_required()
def list_files(group_id):
    user_id = get_jwt_identity()
    if not GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'msg': 'Not a group member'}), 403
    files = File.query.filter_by(group_id=group_id).all()
    return jsonify([
        {'id': f.id, 'filename': f.filename, 'uploaded_at': f.uploaded_at.isoformat(), 'uploader_id': f.uploader_id}
        for f in files
    ])

@files_bp.route('/<int:group_id>/download/<int:file_id>', methods=['GET'])
@jwt_required()
def download_file(group_id, file_id):
    user_id = get_jwt_identity()
    if not GroupMembership.query.filter_by(user_id=user_id, group_id=group_id).first():
        return jsonify({'msg': 'Not a group member'}), 403
    db_file = File.query.get(file_id)
    if not db_file or db_file.group_id != group_id:
        return jsonify({'msg': 'File not found'}), 404
    response = minio_client.get_object(os.getenv('MINIO_BUCKET'), db_file.minio_key)
    return send_file(BytesIO(response.read()), download_name=db_file.filename, as_attachment=True) 