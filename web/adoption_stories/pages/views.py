from adopteeStories.models import Adoptee, RelationshipCategory, AboutPerson
from adopteeStories import serializers
from django.db.models import Q
from django.shortcuts import render
from django.core.paginator import Paginator
from django.core.paginator import EmptyPage
from django.core.paginator import PageNotAnInteger
from django.db import connection




# Create your views here.
def index(request):
	#return HttpResponse("<h2>f</h2>")
    #import pdb; pdb.set_trace()
    return render(request, 'pages/index.html')

def privacy(request):
    return render(request,'pages/privacy.html')
