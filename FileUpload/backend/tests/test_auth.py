import unittest
import json
from app import create_app, db
from app.models import User

class AuthTestCase(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.app.config['TESTING'] = True
        self.app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        self.client = self.app.test_client()
        
        with self.app.app_context():
            db.create_all()
    
    def tearDown(self):
        with self.app.app_context():
            db.session.remove()
            db.drop_all()
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        response = self.client.post('/api/auth/register',
                                  data=json.dumps({'username': 'testuser', 'password': 'testpass'}),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertEqual(data['msg'], 'User registered successfully')
    
    def test_user_login(self):
        """Test user login endpoint"""
        # First register a user
        self.client.post('/api/auth/register',
                        data=json.dumps({'username': 'testuser', 'password': 'testpass'}),
                        content_type='application/json')
        
        # Then try to login
        response = self.client.post('/api/auth/login',
                                  data=json.dumps({'username': 'testuser', 'password': 'testpass'}),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIn('access_token', data)
        self.assertEqual(data['username'], 'testuser')
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        response = self.client.post('/api/auth/login',
                                  data=json.dumps({'username': 'wronguser', 'password': 'wrongpass'}),
                                  content_type='application/json')
        self.assertEqual(response.status_code, 401)
        data = json.loads(response.data)
        self.assertEqual(data['msg'], 'Invalid credentials')

if __name__ == '__main__':
    unittest.main() 