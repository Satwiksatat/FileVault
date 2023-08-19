import os
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout

from django.contrib import messages

from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import Group, User

# Create your views here.
from .models import *
from .forms import CreateUserForm, StoreProduct
from .decorators import unauthenticated_user, allowed_users

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

list = []
temp = []
path = os.path.join(BASE_DIR, "Generated_Documents")


@unauthenticated_user
def registerPage(request):
    form = CreateUserForm()
    if request.method == 'POST':
        form = CreateUserForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get('username')

            group = Group.objects.get(name='customer')
            user.groups.add(group)

            messages.success(request, 'Account was created for ' + username)

            return redirect('login')

    context = {'form': form}
    return render(request, 'accounts/register.html', context)


@unauthenticated_user
def loginPage(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('products')
        else:
            messages.info(request, 'Username OR password is incorrect')

    context = {}
    return render(request, 'accounts/login.html', context)


def logoutUser(request):
    logout(request)
    return redirect('login')


@login_required(login_url='login')
def products(request):
    if request.method == "POST":
        store = StoreProduct(request.POST, request.FILES)
        if store.is_valid():
            store.save()
            return redirect('products')
    else:
        store = StoreProduct()
        datas = Store.objects.all()
        return render(request, 'accounts/products.html', {'store': store, 'datas': datas})


@login_required(login_url='login')
@allowed_users(allowed_roles=['admin'])
def updateProduct(request, id):
    pro = Store.objects.get(id=id)
    form = StoreProduct(instance=pro)

    if request.method == "POST":
        form = StoreProduct(request.POST, request.FILES, instance=pro)
        if form.is_valid():
            form.save()
            return redirect("products")

    return render(request, 'accounts/edit.html', {'form': form})


@login_required(login_url='login')
@allowed_users(allowed_roles=['admin'])
def deleteProduct(request, id):
    product = Store.objects.get(id=id)
    if request.method == "POST":
        product.delete()

    return redirect('products')


@login_required(login_url='login')
@allowed_users(allowed_roles=['admin'])
def delete(request):
    if request.method == "POST":
        products_id = request.POST.getlist('id[]')
        for id in products_id:
            Store.objects.get(id=id).delete()

        return redirect('products')




