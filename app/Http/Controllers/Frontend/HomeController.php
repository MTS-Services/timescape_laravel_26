<?php

namespace App\Http\Controllers\Frontend;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Laravel\Fortify\Features;

class HomeController extends Controller
{
    public function home()
    {
        // $canRegister = Features::enabled(Features::registration());
        // return Inertia::render('frontend/home', [
        //     'canRegister' => $canRegister,
        //     ]);
        return Inertia::render('frontend/home');
    }
}
