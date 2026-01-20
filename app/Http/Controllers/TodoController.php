<?php

namespace App\Http\Controllers;

use App\Http\Requests\TodoStoreRequest;
use App\Http\Requests\TodoUpdateRequest;
use App\Models\Todo;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class TodoController extends Controller
{
    /**
     * Display a listing of the todos.
     */
    public function index(): Response
    {
        return Inertia::render('todos/index', [
            'todos' => Todo::query()->latest()->get(),
        ]);
    }

    /**
     * Store a newly created todo in storage.
     */
    public function store(TodoStoreRequest $request): RedirectResponse
    {
        Todo::create($request->validated());

        return redirect()->route('todos.index');
    }

    /**
     * Update the specified todo in storage.
     */
    public function update(TodoUpdateRequest $request, Todo $todo): RedirectResponse
    {
        $todo->update($request->validated());

        return redirect()->route('todos.index');
    }

    /**
     * Remove the specified todo from storage.
     */
    public function destroy(Todo $todo): RedirectResponse
    {
        $todo->delete();

        return redirect()->route('todos.index');
    }
}
