import { Head, Link, router, useForm } from '@inertiajs/react';
import { store, update, destroy } from '@/actions/App/Http/Controllers/TodoController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import InputError from '@/components/input-error';

interface Todo {
    id: number;
    title: string;
    description: string | null;
    completed: boolean;
    created_at: string;
    updated_at: string;
}

interface TodosPageProps {
    todos: Todo[];
}

export default function TodosIndex({ todos }: TodosPageProps) {
    const { data, setData, submit, processing, errors, reset } = useForm({
        title: '',
        description: '',
        completed: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        submit(store(), {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const handleToggleComplete = (todo: Todo) => {
        router.patch(update(todo.id), {
            title: todo.title,
            description: todo.description,
            completed: !todo.completed,
        }, {
            preserveScroll: true,
        });
    };

    const handleDelete = (todo: Todo) => {
        if (confirm('Are you sure you want to delete this todo?')) {
            router.delete(destroy(todo.id), {
                preserveScroll: true,
            });
        }
    };

    return (
        <>
            <Head title="Todos" />
            <div className="min-h-screen bg-background p-6">
                <div className="mx-auto max-w-4xl">
                    <div className="mb-8 flex items-center justify-between gap-4">
                        <h1 className="text-3xl font-bold">Todo List</h1>
                        <Link
                            href={route('home')}
                            className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        >
                            Back to Home
                        </Link>
                    </div>

                    {/* Create Todo Form */}
                    <div className="mb-8 rounded-lg border border-border bg-card p-6 shadow-sm">
                        <h2 className="mb-4 text-xl font-semibold">Add New Todo</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="title">Title</Label>
                                <Input
                                    id="title"
                                    type="text"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    className="mt-1"
                                    placeholder="Enter todo title"
                                />
                                <InputError message={errors.title} className="mt-1" />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="mt-1 flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    placeholder="Enter todo description (optional)"
                                />
                                <InputError message={errors.description} className="mt-1" />
                            </div>

                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creating...' : 'Add Todo'}
                            </Button>
                        </form>
                    </div>

                    {/* Todos List */}
                    <div className="space-y-4">
                        {todos.length === 0 ? (
                            <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
                                No todos yet. Create your first todo above!
                            </div>
                        ) : (
                            todos.map((todo) => (
                                <div
                                    key={todo.id}
                                    className="rounded-lg border border-border bg-card p-6 shadow-sm"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="mt-1">
                                            <Checkbox
                                                checked={todo.completed}
                                                onCheckedChange={() => handleToggleComplete(todo)}
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3
                                                className={`text-lg font-semibold ${todo.completed
                                                    ? 'line-through text-muted-foreground'
                                                    : ''
                                                    }`}
                                            >
                                                {todo.title}
                                            </h3>
                                            {todo.description && (
                                                <p
                                                    className={`mt-2 text-sm text-muted-foreground ${todo.completed ? 'line-through' : ''
                                                        }`}
                                                >
                                                    {todo.description}
                                                </p>
                                            )}
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(todo)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
