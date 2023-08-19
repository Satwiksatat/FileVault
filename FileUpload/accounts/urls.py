from django.urls import path
import views

urlpatterns = [
	path('register/', views.registerPage, name="register"),
	path('login/', views.loginPage, name="login"),
	path('logout/', views.logoutUser, name="logout"),
	path('', views.products, name='products'),
	path('delete/', views.delete, name="delete"),
	path('update_product/<int:id>/', views.updateProduct, name="update_product"),
	path('delete_product/<int:id>/', views.deleteProduct, name="delete_product"),
]

#
